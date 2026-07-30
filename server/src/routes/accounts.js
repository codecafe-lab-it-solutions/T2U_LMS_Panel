const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = require('../lib/prisma');

// Accounts & Finance module — Super Admin only, same access pattern as HRMS payroll
// (server/src/routes/employeePayroll.js) — no employee-permission override exists for this
// router, and none should ever be added.
router.use(authenticate, requireAdmin);

function num(v) { return v == null ? 0 : parseFloat(v.toString()); }
function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

function dateRangeFor(period) {
  const now = new Date();
  if (period === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { gte: start };
  }
  if (period === 'year') {
    return { gte: new Date(now.getFullYear(), 0, 1) };
  }
  if (period === 'all') {
    return undefined;
  }
  // default: month
  return { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
}

// GET /api/accounts/overview?period=today|month|year|all — consolidated finance dashboard KPIs.
// Sales are aggregated from the existing Invoice/PackagePurchaseLog data (no duplicate records
// created); expenses combine existing payroll data with the new manually-entered Expense table.
router.get('/overview', async (req, res) => {
  try {
    const period = ['today', 'month', 'year', 'all'].includes(req.query.period) ? req.query.period : 'month';
    const range = dateRangeFor(period);
    const createdAtWhere = range ? { created_at: range } : {};
    const expenseDateWhere = range ? { expense_date: range } : {};
    const paidAtWhere = range ? { paid_at: range } : {};
    const awardedOnWhere = range ? { awarded_on: range } : {};

    const [
      courseSalesAgg,
      productSalesAgg,
      pkgLogGroups,
      commissionPaidAgg,
      commissionByType,
      payslipAgg,
      incentiveAgg,
      marketingAgg,
      purchasesAgg,
      operationalAgg,
      otherAgg,
    ] = await Promise.all([
      prisma.invoice.aggregate({ where: { reference_type: 'enrollment', status: 'paid', ...createdAtWhere }, _sum: { total_amount: true } }),
      prisma.invoice.aggregate({ where: { reference_type: 'product_order', status: 'paid', ...createdAtWhere }, _sum: { total_amount: true } }),
      prisma.packagePurchaseLog.groupBy({ by: ['package_id'], where: { ...createdAtWhere }, _count: true }),
      prisma.commissionTransaction.aggregate({ where: { status: 'paid', ...createdAtWhere }, _sum: { amount: true } }),
      prisma.commissionTransaction.groupBy({ by: ['type'], where: { status: 'paid', ...createdAtWhere }, _sum: { amount: true } }),
      prisma.employeePayslip.aggregate({ where: { status: 'paid', ...paidAtWhere }, _sum: { net_pay: true } }),
      prisma.employeeIncentive.aggregate({ where: { ...awardedOnWhere }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { category: 'marketing', deleted_at: null, ...expenseDateWhere }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { category: 'purchases', deleted_at: null, ...expenseDateWhere }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { category: 'operational', deleted_at: null, ...expenseDateWhere }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { category: 'other', deleted_at: null, ...expenseDateWhere }, _sum: { amount: true } }),
    ]);

    // Package sales: PackagePurchaseLog doesn't snapshot the price paid, so it's resolved via
    // each package's current price — a known approximation if a package's price changes later.
    let packageSales = 0;
    if (pkgLogGroups.length > 0) {
      const packages = await prisma.package.findMany({
        where: { id: { in: pkgLogGroups.map(g => g.package_id) } },
        select: { id: true, price: true },
      });
      const priceById = Object.fromEntries(packages.map(p => [p.id, num(p.price)]));
      packageSales = pkgLogGroups.reduce((sum, g) => sum + (priceById[g.package_id] ?? 0) * g._count, 0);
    }

    const courseSales = num(courseSalesAgg._sum.total_amount);
    const productSales = num(productSalesAgg._sum.total_amount);
    const totalSales = round2(courseSales + productSales + packageSales);

    const salaryExpense = round2(num(payslipAgg._sum.net_pay) + num(incentiveAgg._sum.amount));
    const marketingExpense = num(marketingAgg._sum.amount);
    const purchasesExpense = num(purchasesAgg._sum.amount);
    const operationalExpense = num(operationalAgg._sum.amount);
    const otherExpense = num(otherAgg._sum.amount);
    const commissionPaid = num(commissionPaidAgg._sum.amount);

    const totalExpenses = round2(salaryExpense + marketingExpense + purchasesExpense + operationalExpense + otherExpense + commissionPaid);
    const netProfit = round2(totalSales - totalExpenses);

    const commissionBreakdown = Object.fromEntries(commissionByType.map(row => [row.type, num(row._sum.amount)]));

    res.json({
      period,
      sales: { courseSales, productSales, packageSales, totalSales },
      expenses: {
        salaryExpense,
        marketingExpense,
        purchasesExpense,
        operationalExpense,
        otherExpense,
        commissionPaid,
        commissionBreakdown, // { dsi, gen2, gen3, binary, car_fund, house_fund, royalty, instructor_commission }
        totalExpenses,
      },
      netProfit,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
