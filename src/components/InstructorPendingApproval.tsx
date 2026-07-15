import { Clock, ShieldCheck, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '../store/useAppStore';

export default function InstructorPendingApproval() {
  const setActiveTab = useAppStore(s => s.setActiveTab);

  return (
    <div className="max-w-lg mx-auto py-10">
      <Card className="border border-amber-500/25 bg-amber-500/5 shadow-sm">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7 text-amber-500" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-foreground">Awaiting Admin Approval</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your instructor account is registered but not yet approved. Course creation, live class
              scheduling, quiz &amp; assignment creation, and batch management unlock once an admin
              approves your account.
            </p>
          </div>
          <div className="p-3 rounded-lg border border-border/50 bg-card text-left space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">You can still:</p>
            <ul className="text-xs text-foreground space-y-1">
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />Complete your KYC verification</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />Update your profile &amp; settings</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />Browse courses and view notifications</li>
            </ul>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <Button type="button" size="sm" onClick={() => setActiveTab('kyc')} className="text-xs h-9 bg-primary text-primary-foreground">
              Complete KYC
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setActiveTab('support')} className="text-xs h-9">
              <HelpCircle className="w-3.5 h-3.5 mr-1.5" />Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
