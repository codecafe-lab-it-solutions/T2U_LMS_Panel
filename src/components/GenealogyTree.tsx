import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { 
  Users, TrendingUp, Sparkles, AlertCircle, Plus, Trophy, Info, Award
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function GenealogyTree() {
  const { leftTeamBV, rightTeamBV, addLeftBV, addRightBV, claimMatchingBonus } = useAppStore();
  const [addingLeft, setAddingLeft] = useState(false);
  const [addingRight, setAddingRight] = useState(false);

  // Search & Filter state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [bvThreshold, setBvThreshold] = useState(0);
  const [salesThreshold, setSalesThreshold] = useState(0);

  const matchedBV = Math.min(leftTeamBV, rightTeamBV);
  const matchingBonusINR = (matchedBV / 1000) * 120; // ₹120 per 1000 BV matched (12% matching ratio)
  
  const dailyCapINR = 10000;
  const progressToCap = Math.min(100, (matchingBonusINR / dailyCapINR) * 100);

  const handleAddLeft = () => {
    setAddingLeft(true);
    setTimeout(() => {
      addLeftBV(1000);
      setAddingLeft(false);
    }, 400);
  };

  const handleAddRight = () => {
    setAddingRight(true);
    setTimeout(() => {
      addRightBV(1000);
      setAddingRight(false);
    }, 400);
  };

  // Node highlight rules helper for intermediary/leader nodes
  const renderNode = (node: {
    username: string;
    name: string;
    weeklyBV: number;
    totalSales: number;
    sideText: string;
    borderClass: string;
  }) => {
    const isSearchMatch = searchQuery.trim() !== '' && 
      (node.username.toLowerCase().includes(searchQuery.toLowerCase().trim()) || 
       node.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
    const isBvMatch = bvThreshold > 0 && node.weeklyBV >= bvThreshold;
    const isSalesMatch = salesThreshold > 0 && node.totalSales >= salesThreshold;
    const highlighted = isSearchMatch || isBvMatch || isSalesMatch;

    let highlightClass = node.borderClass;
    if (highlighted) {
      if (isSearchMatch) {
        highlightClass = 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#0f071c] shadow-[0_0_15px_rgba(124,58,237,0.6)] border-violet-500';
      } else if (isBvMatch) {
        highlightClass = 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#0f071c] shadow-[0_0_15px_rgba(16,185,129,0.6)] border-emerald-500';
      } else if (isSalesMatch) {
        highlightClass = 'ring-2 ring-orange-500 ring-offset-2 ring-offset-[#0f071c] shadow-[0_0_15px_rgba(249,115,22,0.6)] border-orange-500';
      }
    }

    return (
      <div className={`bg-[#0c0517] rounded-lg px-4 py-2.5 border transition-all duration-300 ${highlightClass}`}>
        <span className="text-[8px] font-bold text-muted-foreground font-mono block uppercase">{node.sideText}</span>
        <h5 className="text-[11px] font-bold text-foreground mt-0.5 truncate">{node.name}</h5>
        <span className="text-[8.5px] text-muted-foreground/60 font-mono block">@{node.username}</span>
        <div className="flex justify-between items-center text-[8.5px] font-mono text-muted-foreground mt-1 gap-2 pt-1 border-t border-border/30">
          <span className={isBvMatch ? 'text-emerald-400 font-bold' : ''}>Vol: {node.weeklyBV.toLocaleString()} BV</span>
          <span className={isSalesMatch ? 'text-orange-400 font-bold' : ''}>Sales: ₹{node.totalSales.toLocaleString()}</span>
        </div>
        {highlighted && (
          <span className="inline-block mt-1 text-[7.5px] font-extrabold uppercase px-1 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
            {isSearchMatch ? '🔍 Match' : isBvMatch ? '⚡ Target BV' : '💰 Sales Match'}
          </span>
        )}
      </div>
    );
  };

  // Node highlight helper for leaf nodes
  const renderLeafNode = (node: {
    username: string;
    name: string;
    weeklyBV: number;
    totalSales: number;
    sideText: string;
  }) => {
    const isSearchMatch = searchQuery.trim() !== '' && 
      (node.username.toLowerCase().includes(searchQuery.toLowerCase().trim()) || 
       node.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
    const isBvMatch = bvThreshold > 0 && node.weeklyBV >= bvThreshold;
    const isSalesMatch = salesThreshold > 0 && node.totalSales >= salesThreshold;
    const highlighted = isSearchMatch || isBvMatch || isSalesMatch;

    let highlightClass = 'border-border/40';
    if (highlighted) {
      if (isSearchMatch) {
        highlightClass = 'ring-1 ring-violet-500 border-violet-500 shadow-[0_0_10px_rgba(124,58,237,0.5)]';
      } else if (isBvMatch) {
        highlightClass = 'ring-1 ring-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
      } else if (isSalesMatch) {
        highlightClass = 'ring-1 ring-orange-500 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]';
      }
    }

    return (
      <div className={`bg-[#150b26]/50 rounded-lg p-1.5 border text-[9px] font-mono text-left transition-all duration-300 ${highlightClass}`}>
        <span className="text-muted-foreground block text-[7px] font-bold uppercase truncate">{node.sideText}</span>
        <span className="font-bold text-foreground block truncate">{node.name}</span>
        <span className="text-[7.5px] text-muted-foreground/60 block font-mono">@{node.username}</span>
        <div className="flex flex-col gap-0.5 mt-0.5 text-[7px] text-muted-foreground border-t border-border/20 pt-0.5">
          <span className={isBvMatch ? 'text-emerald-400 font-bold' : ''}>{node.weeklyBV} BV</span>
          <span className={isSalesMatch ? 'text-orange-400 font-bold' : ''}>₹{node.totalSales}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 select-none">
      
      {/* Summary KPI Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Team total BV */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Left Downline (Ram Node)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono">
                {leftTeamBV.toLocaleString()} BV
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground font-sans">
              Total volume generated by Ram and active left downline members.
            </p>
            <Button
              id="btn-add-left-bv"
              onClick={handleAddLeft}
              disabled={addingLeft}
              size="sm"
              className="w-full text-[10px] h-8 bg-secondary hover:bg-muted text-primary hover:text-primary border border-border font-bold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add 1,000 BV (Left)
            </Button>
          </CardContent>
        </Card>

        {/* Right Team total BV */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Right Downline (Shyam Node)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono">
                {rightTeamBV.toLocaleString()} BV
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground font-sans">
              Total volume generated by Shyam and active right downline members.
            </p>
            <Button
              id="btn-add-right-bv"
              onClick={handleAddRight}
              disabled={addingRight}
              size="sm"
              className="w-full text-[10px] h-8 bg-secondary hover:bg-muted text-primary hover:text-primary border border-border font-bold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add 1,000 BV (Right)
            </Button>
          </CardContent>
        </Card>

        {/* Binary Matching Bonus summary card */}
        <Card className="border border-border bg-card shadow-sm border-primary/20 shadow-primary/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-primary uppercase tracking-wider">
              Estimated Matching Reward
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono">
                ₹{matchingBonusINR.toLocaleString()}
              </span>
              <span className="text-[9.5px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                1:1 Match (12%)
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground font-sans">
              Matched balance: {matchedBV.toLocaleString()} BV
            </p>
            <Button
              id="btn-claim-matching-bonus"
              onClick={claimMatchingBonus}
              disabled={matchedBV === 0}
              size="sm"
              className="w-full text-[10px] h-8 bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-md shadow-primary/10"
            >
              <Trophy className="w-3.5 h-3.5 mr-1 text-amber-300" />
              Claim Match Payout Sweep
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* Compliance Search & Filters Card */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">
            Downline Filters & Analytics
          </CardTitle>
          <CardDescription className="text-xs">
            Query individual users or filter branch nodes by weekly business volume targets and downline sales.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Search Usernames / Names</label>
            <input 
              type="text" 
              placeholder="e.g. ram101, priyapatel..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs h-9 bg-muted/20 border border-border rounded-lg px-3 focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>
          
          <div className="space-y-1.5 text-left">
            <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase">
              <span>Weekly BV Threshold</span>
              {bvThreshold > 0 && <span className="font-mono text-primary font-bold">&gt;= {bvThreshold.toLocaleString()} BV</span>}
            </div>
            <input 
              type="range"
              min={0}
              max={15000}
              step={1000}
              value={bvThreshold}
              onChange={(e) => setBvThreshold(Number(e.target.value))}
              className="w-full accent-primary bg-muted rounded-lg appearance-none cursor-pointer h-1.5 mt-3.5"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase">
              <span>Min Total Sales</span>
              {salesThreshold > 0 && <span className="font-mono text-orange-500 font-bold">&gt;= ₹{salesThreshold.toLocaleString()}</span>}
            </div>
            <input 
              type="range"
              min={0}
              max={50000}
              step={2000}
              value={salesThreshold}
              onChange={(e) => setSalesThreshold(Number(e.target.value))}
              className="w-full accent-orange-500 bg-muted rounded-lg appearance-none cursor-pointer h-1.5 mt-3.5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Matching dynamic capping warnings */}
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl text-left">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Earnings Daily Capping Limit
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
              To ensure system sustainability, we implement a maximum daily matching cap of <strong className="text-foreground">₹10,000</strong>. Your current match payout pace is at <strong className="text-primary">₹{matchingBonusINR}</strong>.
            </p>
          </div>
          
          <div className="w-full md:w-64 space-y-1.5 shrink-0 pt-2 md:pt-0 text-left">
            <div className="flex justify-between text-[10.5px]">
              <span className="text-muted-foreground">Daily Limit progress:</span>
              <span className="font-bold text-foreground font-mono">{progressToCap.toFixed(1)}%</span>
            </div>
            <Progress value={progressToCap} className="h-1.5 bg-muted-foreground/10" />
          </div>
        </CardContent>
      </Card>

      {/* Main Binary Genealogy Visualization */}
      <Card className="border border-border bg-card shadow-sm overflow-hidden min-h-[520px] flex flex-col">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            Downline Genealogy Chronology Tree
          </CardTitle>
          <CardDescription className="text-xs font-sans">
            Visual representations of Left (Ram) and Right (Shyam) active downline branches.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 md:p-12 overflow-x-auto flex-1 flex items-center justify-center scrollbar-none">
          <div className="min-w-[900px] text-center space-y-8 relative">
            
            {/* SVG Connecting Vectors */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <svg className="w-full h-full stroke-primary/20 dark:stroke-primary/10 fill-none" strokeWidth="2">
                {/* Root to Level 1 */}
                <path d="M 450 45 L 225 120" />
                <path d="M 450 45 L 675 120" />
                
                {/* Level 1 to Level 2 */}
                <path d="M 225 155 L 112 240" />
                <path d="M 225 155 L 337 240" />
                <path d="M 675 155 L 562 240" />
                <path d="M 675 155 L 787 240" />
                
                {/* Level 2 to Level 3 */}
                <path d="M 112 275 L 56 360" />
                <path d="M 112 275 L 168 360" />
                <path d="M 337 275 L 281 360" />
                <path d="M 337 275 L 393 360" />
                <path d="M 562 275 L 506 360" />
                <path d="M 562 275 L 618 360" />
                <path d="M 787 275 L 731 360" />
                <path d="M 787 275 L 843 360" />
              </svg>
            </div>

            {/* LEVEL 0: ROOT (YOU) */}
            <div className="relative z-10">
              <div className="inline-block p-1 rounded-2xl bg-gradient-to-tr from-violet-600 to-orange-500 shadow-md">
                <div className="bg-[#0f071c] rounded-xl px-7 py-3 text-center min-w-[150px] border border-white/5">
                  <span className="text-[10px] font-bold text-violet-400 font-mono block">SPONSOR NODE</span>
                  <h4 className="text-xs font-bold text-white mt-0.5">You</h4>
                  <span className="text-[9px] text-muted-foreground font-mono block mt-1">Matched: {matchedBV.toLocaleString()} BV</span>
                </div>
              </div>
            </div>

            {/* LEVEL 1: BRANCH NODES */}
            <div className="grid grid-cols-2 gap-12 max-w-4xl mx-auto relative z-10">
              {/* Left Branch: Ram */}
              <div className="text-center">
                <div className="inline-block p-0.5 rounded-xl bg-violet-600/30">
                  <div className="min-w-[155px] text-left">
                    {renderNode({
                      username: 'ram101',
                      name: 'Ram',
                      weeklyBV: 12000,
                      totalSales: 48000,
                      sideText: 'LEFT LEADER',
                      borderClass: 'border-violet-500/20'
                    })}
                    <div className="text-center text-[9px] font-bold text-emerald-500 font-mono mt-1 bg-emerald-500/5 py-0.5 rounded">
                      {(leftTeamBV - matchedBV).toLocaleString()} BV Rollover
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Branch: Shyam */}
              <div className="text-center">
                <div className="inline-block p-0.5 rounded-xl bg-orange-500/30">
                  <div className="min-w-[155px] text-left">
                    {renderNode({
                      username: 'shyam202',
                      name: 'Shyam',
                      weeklyBV: 8000,
                      totalSales: 32000,
                      sideText: 'RIGHT LEADER',
                      borderClass: 'border-orange-500/20'
                    })}
                    <div className="text-center text-[9px] font-bold text-emerald-500 font-mono mt-1 bg-emerald-500/5 py-0.5 rounded">
                      {(rightTeamBV - matchedBV).toLocaleString()} BV Rollover
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LEVEL 2: INTERMEDIARY DOWNLINES */}
            <div className="grid grid-cols-4 gap-4 max-w-5xl mx-auto relative z-10">
              <div className="text-center flex justify-center">
                <div className="inline-block min-w-[135px] text-left">
                  {renderNode({
                    username: 'rahul99',
                    name: 'Rahul Sharma',
                    weeklyBV: 4000,
                    totalSales: 16000,
                    sideText: 'RAM LEFT NODE',
                    borderClass: 'border-border'
                  })}
                </div>
              </div>
              <div className="text-center flex justify-center">
                <div className="inline-block min-w-[135px] text-left">
                  {renderNode({
                    username: 'priyapatel',
                    name: 'Priya Patel',
                    weeklyBV: 7000,
                    totalSales: 21000,
                    sideText: 'RAM RIGHT NODE',
                    borderClass: 'border-border'
                  })}
                </div>
              </div>
              <div className="text-center flex justify-center">
                <div className="inline-block min-w-[135px] text-left">
                  {renderNode({
                    username: 'amitv',
                    name: 'Amit Verma',
                    weeklyBV: 5000,
                    totalSales: 15000,
                    sideText: 'SHYAM LEFT NODE',
                    borderClass: 'border-border'
                  })}
                </div>
              </div>
              <div className="text-center flex justify-center">
                <div className="inline-block min-w-[135px] text-left">
                  {renderNode({
                    username: 'nehag',
                    name: 'Neha Gupta',
                    weeklyBV: 6000,
                    totalSales: 18000,
                    sideText: 'SHYAM RIGHT NODE',
                    borderClass: 'border-border'
                  })}
                </div>
              </div>
            </div>

            {/* LEVEL 3: LEAF DOWNLINE VOLUMES */}
            <div className="grid grid-cols-8 gap-2 max-w-[950px] mx-auto relative z-10">
              <div className="text-center">
                {renderLeafNode({
                  username: 'anilk',
                  name: 'Anil Kumar',
                  weeklyBV: 1000,
                  totalSales: 4000,
                  sideText: 'Leaf L1'
                })}
              </div>
              <div className="text-center">
                {renderLeafNode({
                  username: 'sunitarao',
                  name: 'Sunita Rao',
                  weeklyBV: 3000,
                  totalSales: 9000,
                  sideText: 'Leaf L2'
                })}
              </div>
              <div className="text-center">
                {renderLeafNode({
                  username: 'vikrams',
                  name: 'Vikram Singh',
                  weeklyBV: 5000,
                  totalSales: 12000,
                  sideText: 'Leaf L3'
                })}
              </div>
              <div className="text-center">
                {renderLeafNode({
                  username: 'poojah',
                  name: 'Pooja Hegde',
                  weeklyBV: 2000,
                  totalSales: 6000,
                  sideText: 'Leaf L4'
                })}
              </div>
              <div className="text-center">
                {renderLeafNode({
                  username: 'rajeshas',
                  name: 'Rajesh Sen',
                  weeklyBV: 5000,
                  totalSales: 15000,
                  sideText: 'Leaf R1'
                })}
              </div>
              <div className="text-center">
                {renderLeafNode({
                  username: 'meenas',
                  name: 'Meena Sharma',
                  weeklyBV: 3000,
                  totalSales: 9000,
                  sideText: 'Leaf R2'
                })}
              </div>
              <div className="text-center">
                {renderLeafNode({
                  username: 'sanjayd',
                  name: 'Sanjay Dutt',
                  weeklyBV: 5000,
                  totalSales: 15000,
                  sideText: 'Leaf R3'
                })}
              </div>
              <div className="text-center">
                {renderLeafNode({
                  username: 'karanj',
                  name: 'Karan Johar',
                  weeklyBV: 1000,
                  totalSales: 3000,
                  sideText: 'Leaf R4'
                })}
              </div>
            </div>

          </div>
        </CardContent>
        
        <div className="p-4 border-t border-border bg-muted/10 flex items-center gap-2 text-[10px] text-muted-foreground font-sans text-left">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <span>Joining BV and Repurchase BV are matched 1:1. Commission is settled in real-time at the updated 12% matching payout rule.</span>
        </div>
      </Card>
    </div>
  );
}
