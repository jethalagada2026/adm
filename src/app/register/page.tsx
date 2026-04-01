
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, Plus, Trash2, ArrowRight, ArrowLeft, LoaderCircle, Users, LogIn, AlertCircle, Wand2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useAuth, useDoc, useMemoFirebase } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { generateTeamNameOptions } from '@/ai/flows/team-name-generator-flow';
import Link from 'next/link';

// Authorized admins
const ADMIN_EMAILS = ["rishikeshavjha51@gmail.com","atharvakadam5507@gmail.com","krishnajha6969@gmail.com","rishikeshav.s.jha24@slrtce.in","77adityadwivedi77@gmail.com"];

const YEAR_OPTIONS = [
  { label: "Level 1 (1st Year)", value: "1st Year" },
  { label: "Level 2 (2nd Year)", value: "2nd Year" },
  { label: "Level 3 (3rd Year)", value: "3rd Year" },
  { label: "Level 4 (4th Year)", value: "4th Year" },
];

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

interface Teammate {
  name: string;
  phone: string;
  email: string;
  college: string;
  degree: string;
  branch: string;
  gender: string;
  year: string;
  linkedinProfileUrl: string;
}

export default function Register() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [teamName, setTeamName] = useState('');
  
  const [leaderData, setLeaderData] = useState({
    phone: '',
    college: '',
    degree: '',
    branch: '',
    gender: '',
    year: '',
    linkedinProfileUrl: '',
    githubProfileUrl: ''
  });

  const [teammates, setTeammates] = useState<Teammate[]>([]);

  // Admin access only
  const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email));

  const leaderRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: existingReg, isLoading: isExistingRegLoading } = useDoc(leaderRef);

  useEffect(() => {
    if (existingReg && !isUserLoading) {
      router.push('/dashboard');
    }
  }, [existingReg, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;
    setAuthError(null);
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        setIsSigningIn(false);
        return; 
      }
      setAuthError("Sign-in failed. Ensure your domain is authorized in Firebase Console.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSuggestTeamName = async () => {
    setIsGeneratingName(true);
    try {
      const result = await generateTeamNameOptions({ 
        description: teamName || "innovation, future, hackathon" 
      });
      const suggested = result.suggestions[Math.floor(Math.random() * result.suggestions.length)];
      setTeamName(suggested);
    } catch (error) {
    } finally {
      setIsGeneratingName(false);
    }
  };

  const handleAddTeammate = () => {
    if (teammates.length >= 3) return;
    setTeammates([...teammates, {
      name: '', phone: '', email: '', college: leaderData.college, degree: leaderData.degree,
      branch: leaderData.branch, gender: '', year: '', linkedinProfileUrl: ''
    }]);
  };

  const handleRemoveTeammate = (index: number) => {
    setTeammates(teammates.filter((_, i) => i !== index));
  };

  const handleTeammateChange = (index: number, field: keyof Teammate, value: string) => {
    const updated = [...teammates];
    updated[index] = { ...updated[index], [field]: value };
    setTeammates(updated);
  };

  const handleFinalSubmit = async () => {
    if (!isAdmin) {
      toast({ variant: "destructive", title: "Registration Restricted", description: "Only authorized administrators can register teams." });
      return;
    }

    setIsLoading(true);
    try {
      const q = query(collection(db, 'users'), where('teamName', '==', teamName), limit(1));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty && querySnapshot.docs[0].id !== user.uid) {
        toast({ variant: "destructive", title: "Team Name Taken", description: "Try a different team name." });
        setIsLoading(false);
        return;
      }
      const leaderRef = doc(db, 'users', user.uid);
      setDocumentNonBlocking(leaderRef, {
        id: user.uid, teamName, name: user.displayName || 'Anonymous', email: user.email || '',
        ...leaderData, registrationDateTime: new Date().toISOString(),
      }, { merge: true });
      for (const tm of teammates) {
        const tmRef = collection(db, 'users', user.uid, 'teamMembers');
        addDocumentNonBlocking(tmRef, { ...tm, teamLeaderId: user.uid, id: Math.random().toString(36).substr(2, 9) });
      }
      router.push('/dashboard');
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || isExistingRegLoading) {
    return <div className="min-h-screen flex items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (user && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full glass-morphism border-primary/20 text-center p-8">
          <ShieldAlert className="text-primary h-12 w-12 mx-auto mb-4" />
          <CardTitle className="font-headline text-2xl">Registration Limited</CardTitle>
          <p className="text-muted-foreground mt-4 mb-8">
            Registration is currently restricted to administrators. If you are a participant, please wait for further announcements.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/" className="w-full"><Button variant="outline" className="w-full">Return Home</Button></Link>
            <Button variant="ghost" onClick={() => auth.signOut()}>Sign Out</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full glass-morphism border-white/5">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Rocket className="text-white h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-headline">Join Horizon</CardTitle>
            <CardDescription>Sign in to start your registration process.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {authError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{authError}</AlertDescription></Alert>}
            <Button onClick={handleGoogleSignIn} className="w-full h-12 gap-2 text-base font-bold" variant="outline" disabled={isSigningIn}>
              {isSigningIn ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Sign in with Google
            </Button>
          </CardContent>
          <CardFooter className="text-center justify-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Authorized Admins Only</p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isStep1Valid = teamName && leaderData.phone && leaderData.college && leaderData.degree && leaderData.branch && leaderData.gender && leaderData.year && leaderData.linkedinProfileUrl && leaderData.githubProfileUrl;
  const isTeammatesValid = teammates.every(tm => tm.name && tm.phone && tm.email && tm.gender && tm.year && tm.linkedinProfileUrl);

  return (
    <div className="min-h-screen py-8 md:py-12 px-4 flex items-center justify-center bg-background">
      <div className="max-w-2xl w-full space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg"><Rocket className="text-white h-6 w-6" /></div>
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold font-headline">Registration</h1>
            <p className="text-xs text-muted-foreground">Admin: {user.email}</p>
          </div>
        </div>
        <div className="relative">
          <Card className="mt-4 border-white/5 glass-morphism">
            {step === 1 && (
              <>
                <CardHeader><CardTitle className="text-lg">Step 1: Leader Details</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Team Name</Label>
                    <div className="flex gap-2">
                      <Input id="teamName" placeholder="Unique team identifier" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
                      <Button type="button" variant="secondary" onClick={handleSuggestTeamName} disabled={isGeneratingName} className="shrink-0">
                        {isGeneratingName ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select value={leaderData.gender} onValueChange={(v) => setLeaderData({...leaderData, gender: v})}><SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger><SelectContent>{GENDER_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Select value={leaderData.year} onValueChange={(v) => setLeaderData({...leaderData, year: v})}><SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger><SelectContent>{YEAR_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Phone</Label><Input value={leaderData.phone} onChange={(e) => setLeaderData({...leaderData, phone: e.target.value})} /></div>
                    <div className="space-y-2"><Label>College</Label><Input value={leaderData.college} onChange={(e) => setLeaderData({...leaderData, college: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>LinkedIn</Label><Input value={leaderData.linkedinProfileUrl} onChange={(e) => setLeaderData({...leaderData, linkedinProfileUrl: e.target.value})} /></div>
                    <div className="space-y-2"><Label>GitHub</Label><Input value={leaderData.githubProfileUrl} onChange={(e) => setLeaderData({...leaderData, githubProfileUrl: e.target.value})} /></div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-6"><Button className="gap-2 bg-primary font-bold" onClick={() => setStep(2)} disabled={!isStep1Valid}>Next <ArrowRight className="h-4 w-4" /></Button></CardFooter>
              </>
            )}
            {step === 2 && (
              <>
                <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-lg">Step 2: Members</CardTitle></div><Button variant="outline" size="sm" onClick={handleAddTeammate} disabled={teammates.length >= 3}><Plus className="h-4 w-4" /></Button></CardHeader>
                <CardContent className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                  {teammates.length === 0 && <div className="py-8 text-center border border-dashed rounded-xl bg-secondary/10"><Users className="h-6 w-6 mx-auto text-muted-foreground mb-2" /><p className="text-xs text-muted-foreground">Solo Team</p></div>}
                  {teammates.map((tm, idx) => (
                    <div key={idx} className="p-4 border rounded-xl bg-secondary/10 relative space-y-4">
                      <div className="flex justify-between items-center"><h3 className="font-bold text-xs text-primary uppercase">Member {idx + 1}</h3><Button variant="ghost" size="icon" onClick={() => handleRemoveTeammate(idx)} className="text-destructive h-8 w-8"><Trash2 className="h-4 w-4" /></Button></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>Name</Label><Input value={tm.name} onChange={(e) => handleTeammateChange(idx, 'name', e.target.value)} /></div><div className="space-y-2"><Label>Email</Label><Input value={tm.email} onChange={(e) => handleTeammateChange(idx, 'email', e.target.value)} /></div></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Gender</Label><Select value={tm.gender} onValueChange={(v) => handleTeammateChange(idx, 'gender', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{GENDER_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label>LinkedIn</Label><Input value={tm.linkedinProfileUrl} onChange={(e) => handleTeammateChange(idx, 'linkedinProfileUrl', e.target.value)} /></div>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-6"><Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" /></Button><Button className="gap-2 bg-primary font-bold" onClick={() => setStep(3)} disabled={teammates.length > 0 && !isTeammatesValid}>Preview <ArrowRight className="h-4 w-4" /></Button></CardFooter>
              </>
            )}
            {step === 3 && (
              <>
                <CardHeader><CardTitle className="text-lg">Review & Submit</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-4 text-sm">
                    <div className="flex justify-between font-bold"><span className="text-primary uppercase tracking-widest text-[10px]">Team Name</span><span>{teamName}</span></div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2">
                      <p className="col-span-2 font-bold">{user.displayName} (Leader)</p>
                      <p className="text-muted-foreground">{leaderData.phone}</p>
                      <p className="text-muted-foreground">{leaderData.year}</p>
                    </div>
                    {teammates.length > 0 && <p className="text-[10px] font-bold text-muted-foreground uppercase">{teammates.length} Additional Member(s)</p>}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-6"><Button variant="ghost" onClick={() => setStep(2)}>Back</Button><Button className="gap-2 bg-primary font-bold" onClick={handleFinalSubmit} disabled={isLoading}>{isLoading ? "Processing..." : "Finish Registration"}</Button></CardFooter>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
