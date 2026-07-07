import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api, getStoredToken } from '../../services/api';
import { Trophy, Save, CheckCircle2, Users, GitFork, Car, Home, TrendingUp, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function SaveBar({ saved, error }: { saved: boolean; error: string }) {
  return (
    <div className="flex items-center gap-2 h-5">
      {saved && <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Saved!</p>}
      {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
    </div>
  );
}

export default function AdminMLMCriteria() {
  // ── DSI ───────────────────────────────────────────────────────────────────
  const [dsiRate, setDsiRate]     = useState('25');
  const [dsiSaved, setDsiSaved]   = useState(false);
  const [dsiError, setDsiError]   = useState('');

  // ── Binary Matching ───────────────────────────────────────────────────────
  const [binaryRate, setBinaryRate]     = useState('12');
  const [binaryDailyCap, setBinaryDailyCap] = useState('10000');
  const [binarySaved, setBinarySaved]   = useState(false);
  const [binaryError, setBinaryError]   = useState('');

  // ── Generation Income ─────────────────────────────────────────────────────
  const [gen2Rate, setGen2Rate]   = useState('10');
  const [gen3Rate, setGen3Rate]   = useState('5');
  const [genSaved, setGenSaved]   = useState(false);
  const [genError, setGenError]   = useState('');

  // ── Car Fund ──────────────────────────────────────────────────────────────
  const [carBv, setCarBv]         = useState('50000');
  const [carMonths, setCarMonths] = useState('3');
  const [carRate, setCarRate]     = useState('5');
  const [carSaved, setCarSaved]   = useState(false);
  const [carError, setCarError]   = useState('');

  // ── Product BV ────────────────────────────────────────────────────────────
  const [productBvRate, setProductBvRate] = useState('10');
  const [productBvSaved, setProductBvSaved] = useState(false);
  const [productBvError, setProductBvError] = useState('');

  // ── House Fund ────────────────────────────────────────────────────────────
  const [houseBv, setHouseBv]         = useState('150000');
  const [houseMonths, setHouseMonths] = useState('3');
  const [houseRate, setHouseRate]     = useState('10');
  const [houseSaved, setHouseSaved]   = useState(false);
  const [houseError, setHouseError]   = useState('');

  // ── Load from DB ──────────────────────────────────────────────────────────
  const { data: settingsData } = useQuery<{ map: Record<string, string> }>({
    queryKey: ['platform-settings'],
    queryFn: () => api.platformSettings.get(),
    enabled: !!getStoredToken(),
  });

  useEffect(() => {
    const m = settingsData?.map ?? {};
    if (m.mlm_dsi_rate)          setDsiRate(m.mlm_dsi_rate);
    if (m.mlm_binary_rate)       setBinaryRate(m.mlm_binary_rate);
    if (m.mlm_daily_cap)         setBinaryDailyCap(m.mlm_daily_cap);
    if (m.mlm_gen2_rate)         setGen2Rate(m.mlm_gen2_rate);
    if (m.mlm_gen3_rate)         setGen3Rate(m.mlm_gen3_rate);
    if (m.mlm_car_fund_bv)       setCarBv(m.mlm_car_fund_bv);
    if (m.mlm_car_fund_months)   setCarMonths(m.mlm_car_fund_months);
    if (m.mlm_car_fund_rate)     setCarRate(m.mlm_car_fund_rate);
    if (m.product_bv_rate)        setProductBvRate(m.product_bv_rate);
    if (m.mlm_house_fund_bv)     setHouseBv(m.mlm_house_fund_bv);
    if (m.mlm_house_fund_months) setHouseMonths(m.mlm_house_fund_months);
    if (m.mlm_house_fund_rate)   setHouseRate(m.mlm_house_fund_rate);
  }, [settingsData]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  function makeOk(setS: (v: boolean) => void, setE: (v: string) => void) {
    return () => { setS(true); setE(''); setTimeout(() => setS(false), 2500); };
  }
  function makeErr(setE: (v: string) => void) {
    return (err: any) => setE(err?.message || 'Failed to save');
  }

  const saveDsi = useMutation({
    mutationFn: () => api.platformSettings.updateKey('mlm_dsi_rate', dsiRate),
    onSuccess: makeOk(setDsiSaved, setDsiError),
    onError: makeErr(setDsiError),
  });

  const saveBinary = useMutation({
    mutationFn: () => Promise.all([
      api.platformSettings.updateKey('mlm_binary_rate', binaryRate),
      api.platformSettings.updateKey('mlm_daily_cap', binaryDailyCap),
    ]),
    onSuccess: makeOk(setBinarySaved, setBinaryError),
    onError: makeErr(setBinaryError),
  });

  const saveGen = useMutation({
    mutationFn: () => Promise.all([
      api.platformSettings.updateKey('mlm_gen2_rate', gen2Rate),
      api.platformSettings.updateKey('mlm_gen3_rate', gen3Rate),
    ]),
    onSuccess: makeOk(setGenSaved, setGenError),
    onError: makeErr(setGenError),
  });

  const saveCar = useMutation({
    mutationFn: () => Promise.all([
      api.platformSettings.updateKey('mlm_car_fund_bv', carBv),
      api.platformSettings.updateKey('mlm_car_fund_months', carMonths),
      api.platformSettings.updateKey('mlm_car_fund_rate', carRate),
    ]),
    onSuccess: makeOk(setCarSaved, setCarError),
    onError: makeErr(setCarError),
  });

  const saveHouse = useMutation({
    mutationFn: () => Promise.all([
      api.platformSettings.updateKey('mlm_house_fund_bv', houseBv),
      api.platformSettings.updateKey('mlm_house_fund_months', houseMonths),
      api.platformSettings.updateKey('mlm_house_fund_rate', houseRate),
    ]),
    onSuccess: makeOk(setHouseSaved, setHouseError),
    onError: makeErr(setHouseError),
  });

  const saveProductBv = useMutation({
    mutationFn: () => api.platformSettings.updateKey('product_bv_rate', productBvRate),
    onSuccess: makeOk(setProductBvSaved, setProductBvError),
    onError: makeErr(setProductBvError),
  });

  // ── Live previews ─────────────────────────────────────────────────────────
  const productBvRateN = parseFloat(productBvRate) || 10;
  const carBvN   = parseFloat(carBv)   || 50000;
  const carRateN = parseFloat(carRate) || 5;
  const houseBvN   = parseFloat(houseBv)   || 150000;
  const houseRateN = parseFloat(houseRate) || 10;
  const gen2N = parseFloat(gen2Rate) || 10;
  const gen3N = parseFloat(gen3Rate) || 5;
  const binaryRateN   = parseFloat(binaryRate)   || 12;
  const binaryCapN    = parseFloat(binaryDailyCap) || 10000;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" />
          MLM Incentive Criteria
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          All commission rates, generation income percentages, and fund eligibility thresholds. Changes take effect immediately for new calculations.
        </p>
      </div>

      {/* ── 1. DSI ────────────────────────────────────────────────────────── */}
      <Card className="border border-violet-500/20 bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-500" />
            Direct Sponsor Income (DSI)
          </CardTitle>
          <CardDescription className="text-xs">
            Commission earned by a user when someone they directly referred makes a course purchase. Applied on the BV of the purchased course.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="max-w-xs space-y-1.5">
            <Label className="text-[9px] font-bold text-muted-foreground uppercase">DSI Rate (%)</Label>
            <Input
              type="number" min="0" max="100" step="0.01"
              value={dsiRate} onChange={e => setDsiRate(e.target.value)}
              className="h-9 text-xs bg-muted/20 font-mono"
              placeholder="e.g. 25"
            />
          </div>

          <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl text-[11px] space-y-1">
            <p className="text-[9px] font-bold text-violet-500 uppercase mb-1">Preview — ₹6,000 BV course purchase</p>
            <div className="flex justify-between text-muted-foreground">
              <span>Course BV</span>
              <span className="font-mono font-bold text-foreground">₹6,000</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>DSI to direct sponsor ({dsiRate}%)</span>
              <span className="font-mono text-violet-500">+{fmt(6000 * (parseFloat(dsiRate) || 0) / 100)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button disabled={saveDsi.isPending} onClick={() => { setDsiError(''); saveDsi.mutate(); }}
              className="h-9 text-xs bg-violet-600 hover:bg-violet-700 text-white font-bold px-4">
              <Save className="w-3.5 h-3.5 mr-1" />Save DSI Rate
            </Button>
            <SaveBar saved={dsiSaved} error={dsiError} />
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Binary Matching ────────────────────────────────────────────── */}
      <Card className="border border-emerald-500/20 bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Binary Matching Bonus
          </CardTitle>
          <CardDescription className="text-xs">
            Paid when BV is matched between a user's left and right downline teams. Rate applies on the matched BV. Capped per day.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-sm">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Matching Rate (%)</Label>
              <Input
                type="number" min="0" max="100" step="0.01"
                value={binaryRate} onChange={e => setBinaryRate(e.target.value)}
                className="h-9 text-xs bg-muted/20 font-mono"
                placeholder="e.g. 12"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Daily Cap (₹)</Label>
              <Input
                type="number" min="0" step="100"
                value={binaryDailyCap} onChange={e => setBinaryDailyCap(e.target.value)}
                className="h-9 text-xs bg-muted/20 font-mono"
                placeholder="e.g. 10000"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-[11px] space-y-1">
            <p className="text-[9px] font-bold text-emerald-500 uppercase mb-1">Preview — 1,000 BV matched per side</p>
            <div className="flex justify-between text-muted-foreground">
              <span>Matched BV (per 1,000)</span>
              <span className="font-mono font-bold text-foreground">₹1,000</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Bonus ({binaryRate}%)</span>
              <span className="font-mono text-emerald-500">+{fmt(1000 * binaryRateN / 100)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Maximum per day</span>
              <span className="font-mono text-emerald-500">{fmt(binaryCapN)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button disabled={saveBinary.isPending} onClick={() => { setBinaryError(''); saveBinary.mutate(); }}
              className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4">
              <Save className="w-3.5 h-3.5 mr-1" />Save Binary Matching
            </Button>
            <SaveBar saved={binarySaved} error={binaryError} />
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Generation Income ─────────────────────────────────────────── */}
      <Card className="border border-indigo-500/20 bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <GitFork className="w-4 h-4 text-indigo-500" />
            Generation Income (L2 &amp; L3)
          </CardTitle>
          <CardDescription className="text-xs">
            Paid on DSI earned by downline members. L2 (2nd generation) earns a % of the direct referral's DSI. L3 (3rd generation) earns a % of the 2nd generation's DSI.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-sm">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">2nd Generation Rate (%)</Label>
              <Input
                type="number" min="0" max="100" step="0.01"
                value={gen2Rate} onChange={e => setGen2Rate(e.target.value)}
                className="h-9 text-xs bg-muted/20 font-mono"
                placeholder="e.g. 10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">3rd Generation Rate (%)</Label>
              <Input
                type="number" min="0" max="100" step="0.01"
                value={gen3Rate} onChange={e => setGen3Rate(e.target.value)}
                className="h-9 text-xs bg-muted/20 font-mono"
                placeholder="e.g. 5"
              />
            </div>
          </div>

          {/* User-given example calculation */}
          <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-[11px] space-y-2">
            <p className="text-[9px] font-bold text-indigo-500 uppercase mb-1">Example (as specified)</p>

            <div className="space-y-0.5 text-muted-foreground">
              <p className="font-semibold text-foreground">Scenario A — X generates 48,000 BV</p>
              <div className="flex justify-between">
                <span>X's DSI on 48,000 BV ({dsiRate}%)</span>
                <span className="font-mono">{fmt(48000 * (parseFloat(dsiRate) || 25) / 100)}</span>
              </div>
              <div className="flex justify-between text-indigo-400">
                <span>Your Gen2 income ({gen2Rate}% of X's DSI)</span>
                <span className="font-mono">+{fmt(48000 * (parseFloat(dsiRate) || 25) / 100 * gen2N / 100)}</span>
              </div>
            </div>

            <div className="border-t border-indigo-500/20 pt-2 space-y-0.5 text-muted-foreground">
              <p className="font-semibold text-foreground">Scenario B — X refers 2 diamond students (₹6,000 BV each)</p>
              <div className="flex justify-between">
                <span>X's DSI: 6,000 × 2 × {dsiRate}%</span>
                <span className="font-mono">{fmt(6000 * 2 * (parseFloat(dsiRate) || 25) / 100)}</span>
              </div>
              <div className="flex justify-between text-indigo-400">
                <span>Your Gen2 income ({gen2Rate}%): 6,000 × 2 × {dsiRate}% × {gen2Rate}%</span>
                <span className="font-mono">+{fmt(6000 * 2 * (parseFloat(dsiRate) || 25) / 100 * gen2N / 100)}</span>
              </div>
              <div className="flex justify-between text-blue-400">
                <span>Your Gen3 income ({gen3Rate}%): 6,000 × 2 × {dsiRate}% × {gen3Rate}%</span>
                <span className="font-mono">+{fmt(6000 * 2 * (parseFloat(dsiRate) || 25) / 100 * gen3N / 100)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button disabled={saveGen.isPending} onClick={() => { setGenError(''); saveGen.mutate(); }}
              className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4">
              <Save className="w-3.5 h-3.5 mr-1" />Save Generation Rates
            </Button>
            <SaveBar saved={genSaved} error={genError} />
          </div>
        </CardContent>
      </Card>

      {/* ── 4. Car Fund ──────────────────────────────────────────────────── */}
      <Card className="border border-orange-500/20 bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Car className="w-4 h-4 text-orange-500" />
            Car Fund
          </CardTitle>
          <CardDescription className="text-xs">
            Monthly reward for qualifying members. User must sustain the required BV on both left and right downline teams for the minimum number of consecutive months.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Min BV per Side (₹)</Label>
              <Input
                type="number" min="0" step="1000"
                value={carBv} onChange={e => setCarBv(e.target.value)}
                className="h-9 text-xs bg-muted/20 font-mono"
                placeholder="e.g. 50000"
              />
              <p className="text-[9px] text-muted-foreground">Required on BOTH left and right legs</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Min Continuous Months</Label>
              <Input
                type="number" min="1" max="24" step="1"
                value={carMonths} onChange={e => setCarMonths(e.target.value)}
                className="h-9 text-xs bg-muted/20 font-mono"
                placeholder="e.g. 3"
              />
              <p className="text-[9px] text-muted-foreground">Must maintain BV for this many months</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Monthly Reward Rate (%)</Label>
              <Input
                type="number" min="0" max="100" step="0.01"
                value={carRate} onChange={e => setCarRate(e.target.value)}
                className="h-9 text-xs bg-muted/20 font-mono"
                placeholder="e.g. 5"
              />
              <p className="text-[9px] text-muted-foreground">% of total BV generated that month</p>
            </div>
          </div>

          <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl text-[11px] space-y-1.5">
            <p className="text-[9px] font-bold text-orange-500 uppercase mb-1">Eligibility &amp; Reward Preview</p>
            <div className="flex justify-between text-muted-foreground">
              <span>Minimum BV (each side)</span>
              <span className="font-mono font-bold text-foreground">{fmt(carBvN)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Must maintain for</span>
              <span className="font-mono font-bold text-foreground">{carMonths} months continuously</span>
            </div>
            <div className="border-t border-orange-500/20 pt-1.5 flex justify-between text-muted-foreground">
              <span>Monthly car fund on {fmt(carBvN)} BV generated</span>
              <span className="font-mono text-orange-500 font-bold">+{fmt(carBvN * carRateN / 100)}/month</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button disabled={saveCar.isPending} onClick={() => { setCarError(''); saveCar.mutate(); }}
              className="h-9 text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold px-4">
              <Save className="w-3.5 h-3.5 mr-1" />Save Car Fund Criteria
            </Button>
            <SaveBar saved={carSaved} error={carError} />
          </div>
        </CardContent>
      </Card>

      {/* ── 5. House Fund ────────────────────────────────────────────────── */}
      <Card className="border border-sky-500/20 bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Home className="w-4 h-4 text-sky-500" />
            House Fund
          </CardTitle>
          <CardDescription className="text-xs">
            Higher-tier monthly reward. User must sustain 1.5 lakh BV on both left and right teams continuously to qualify. Reward is a percentage of monthly BV generated.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Min BV per Side (₹)</Label>
              <Input
                type="number" min="0" step="10000"
                value={houseBv} onChange={e => setHouseBv(e.target.value)}
                className="h-9 text-xs bg-muted/20 font-mono"
                placeholder="e.g. 150000"
              />
              <p className="text-[9px] text-muted-foreground">Required on BOTH left and right legs</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Min Continuous Months</Label>
              <Input
                type="number" min="1" max="24" step="1"
                value={houseMonths} onChange={e => setHouseMonths(e.target.value)}
                className="h-9 text-xs bg-muted/20 font-mono"
                placeholder="e.g. 3"
              />
              <p className="text-[9px] text-muted-foreground">Must maintain BV for this many months</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Monthly Reward Rate (%)</Label>
              <Input
                type="number" min="0" max="100" step="0.01"
                value={houseRate} onChange={e => setHouseRate(e.target.value)}
                className="h-9 text-xs bg-muted/20 font-mono"
                placeholder="e.g. 10"
              />
              <p className="text-[9px] text-muted-foreground">% of total BV generated that month</p>
            </div>
          </div>

          <div className="p-3 bg-sky-500/5 border border-sky-500/20 rounded-xl text-[11px] space-y-1.5">
            <p className="text-[9px] font-bold text-sky-500 uppercase mb-1">Eligibility &amp; Reward Preview</p>
            <div className="flex justify-between text-muted-foreground">
              <span>Minimum BV (each side)</span>
              <span className="font-mono font-bold text-foreground">{fmt(houseBvN)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Must maintain for</span>
              <span className="font-mono font-bold text-foreground">{houseMonths} months continuously</span>
            </div>
            <div className="border-t border-sky-500/20 pt-1.5 flex justify-between text-muted-foreground">
              <span>Monthly house fund on {fmt(houseBvN)} BV generated</span>
              <span className="font-mono text-sky-500 font-bold">+{fmt(houseBvN * houseRateN / 100)}/month</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button disabled={saveHouse.isPending} onClick={() => { setHouseError(''); saveHouse.mutate(); }}
              className="h-9 text-xs bg-sky-600 hover:bg-sky-700 text-white font-bold px-4">
              <Save className="w-3.5 h-3.5 mr-1" />Save House Fund Criteria
            </Button>
            <SaveBar saved={houseSaved} error={houseError} />
          </div>
        </CardContent>
      </Card>

      {/* ── 6. Product BV Rate ───────────────────────────────────────────── */}
      <Card className="border border-violet-500/20 bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Package className="w-4 h-4 text-violet-500" />
            Product BV Rate
          </CardTitle>
          <CardDescription className="text-xs">
            Default Business Volume assigned as a percentage of a product's price. When an admin sets a product price, the BV field auto-fills using this rate. The BV can still be overridden per product.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="max-w-xs space-y-1.5">
            <Label className="text-[9px] font-bold text-muted-foreground uppercase">BV Rate (% of product price)</Label>
            <Input
              type="number" min="0" max="100" step="0.01"
              value={productBvRate} onChange={e => setProductBvRate(e.target.value)}
              className="h-9 text-xs bg-muted/20 font-mono"
              placeholder="e.g. 10"
            />
            <p className="text-[9px] text-muted-foreground">
              BV = product price × {productBvRate}% — used as the auto-fill default in Product Management
            </p>
          </div>

          <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl text-[11px] space-y-1.5">
            <p className="text-[9px] font-bold text-violet-500 uppercase mb-1">Preview — example product prices</p>
            {[1000, 4999, 9999, 14999].map(price => (
              <div key={price} className="flex justify-between text-muted-foreground">
                <span>₹{price.toLocaleString('en-IN')} product</span>
                <span className="font-mono">
                  → <span className="text-violet-500 font-bold">
                    {Math.round(price * productBvRateN / 100).toLocaleString('en-IN')} BV
                  </span>
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button disabled={saveProductBv.isPending} onClick={() => { setProductBvError(''); saveProductBv.mutate(); }}
              className="h-9 text-xs bg-violet-600 hover:bg-violet-700 text-white font-bold px-4">
              <Save className="w-3.5 h-3.5 mr-1" />Save Product BV Rate
            </Button>
            <SaveBar saved={productBvSaved} error={productBvError} />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
