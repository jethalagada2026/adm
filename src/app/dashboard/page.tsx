
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { 
  Rocket, 
  FileText, 
  LogOut, 
  LoaderCircle, 
  Sparkles,
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useAuth, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { draftAbstract } from '@/ai/flows/abstract-drafting-assistant-flow';

const ADMIN_EMAILS = ["rishikeshavjha51@gmail.com","atharvakadam5507@gmail.com","krishnajha6969@gmail.com","rishikeshav.s.jha24@slrtce.in","77adityadwivedi77@gmail.com"];

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;
      if (distance < 0) { clearInterval(timer); setTimeLeft(null); }
      else { setTimeLeft({ days: Math.floor(distance / (1000 * 60 * 60 * 24)), hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)), seconds: Math.floor((distance % (1000 * 60)) / 1000) }); }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return <p className="text-center py-4 text-xs font-medium text-muted-foreground bg-secondary/20 rounded-lg">Started</p>;
  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      {['days', 'hours', 'minutes', 'seconds'].map(k => (
        <div key={k} className="flex flex-col p-2 bg-secondary/30 rounded-lg border border-white/5">
          <span className="text-xl font-bold">{timeLeft[k as keyof typeof timeLeft]}</span>
          <span className="text-[10px] uppercase text-muted-foreground font-semibold">{k.slice(0, 4)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const storage = getStorage();

  const leaderRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: registration, isLoading: isRegLoading } = useDoc(leaderRef);
  const membersRef = useMemoFirebase(() => user ? collection(db, 'users', user.uid, 'teamMembers') : null, [db, user]);
  const { data: teamMembers } = useCollection(membersRef);
  const subQuery = useMemoFirebase(() => user ? collection(db, 'users', user.uid, 'projectSubmissions') : null, [db, user]);
  const { data: subs } = useCollection(subQuery);
  const submission = subs?.[0] || null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [form, setForm] = useState({ problemStatement: '', abstract: '' });
  const [file, setFile] = useState<File | null>(null);

  const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email));

  useEffect(() => { if (!isUserLoading && !user) router.push('/register'); }, [user, isUserLoading, router]);

  const handleAIAbstract = async () => {
    if (!form.problemStatement) {
      toast({ variant: "destructive", title: "Missing Input", description: "Describe your problem first." });
      return;
    }
    setIsDrafting(true);
    try {
      const result = await draftAbstract({ 
        problemStatement: form.problemStatement,
        keyDetails: "Hackathon project for Horizon"
      });
      setForm(prev => ({ ...prev, abstract: result.draftedAbstract }));
      toast({ title: "Abstract Drafted!", description: "AI has generated a starting point for you." });
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error", description: "Could not draft abstract." });
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSubmission = async () => {
    if (!isAdmin) {
      toast({ variant: "destructive", title: "Access Denied", description: "Submissions are closed for this hackathon." });
      return;
    }
    if (!form.problemStatement || !form.abstract || !file || !user) return;
    setIsSubmitting(true);
    try {
      const storageRef = ref(storage, `submissions/${user.uid}/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(uploadResult.ref);
      const subRef = collection(db, 'users', user.uid, 'projectSubmissions');
      
      addDocumentNonBlocking(subRef, {
        userId: user.uid, 
        teamLeaderId: user.uid,
        problemStatement: form.problemStatement,
        abstractText: form.abstract,
        pptPdfUrl: url,
        submissionDateTime: new Date().toISOString()
      });
      toast({ title: "Project Submitted!", description: "Good luck with the evaluation!" });
    } catch (e) { 
      toast({ variant: "destructive", title: "Submission Failed", description: "Check your connection or file size." });
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (isUserLoading || isRegLoading) return <div className="min-h-screen flex items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!registration) return <div className="min-h-screen flex items-center justify-center"><Card><CardContent className="pt-6 text-center"><Button onClick={() => router.push('/register')}>Register Now</Button></CardContent></Card></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b glass-morphism sticky top-0 z-50 px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 overflow-hidden">
          <Rocket className="text-primary shrink-0" />
          <div className="truncate">
            <span className="font-bold block text-sm sm:text-base">Horizon</span>
            <p className="text-[10px] text-accent truncate">Team: {registration.teamName}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => auth.signOut()}><LogOut className="h-5 w-5" /></Button>
      </header>
      <main className="max-w-7xl mx-auto w-full p-4 md:p-6 grid lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="glass-morphism border-primary/20">
            <CardHeader><CardTitle className="text-sm">Time Remaining</CardTitle></CardHeader>
            <CardContent><CountdownTimer targetDate="2024-04-06T00:00:00" /></CardContent>
          </Card>
          <Card className="glass-morphism border-white/5">
            <CardHeader><CardTitle className="text-sm">Your Team</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-secondary/30 rounded border border-white/5">
                <p className="font-bold text-sm">{registration.name} (Leader)</p>
                <p className="text-[10px] text-muted-foreground">{registration.college}</p>
              </div>
              {teamMembers?.map((m, i) => (
                <div key={i} className="p-3 bg-secondary/20 rounded border border-white/5">
                  <p className="text-sm">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground">{m.branch} • {m.year}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          {submission ? (
            <Card className="border-accent/20 bg-accent/5">
              <CardHeader><CardTitle className="text-lg">Submission Received</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Problem Statement</Label>
                  <p className="text-sm bg-secondary/20 p-4 rounded-lg leading-relaxed">{submission.problemStatement}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Abstract</Label>
                  <p className="text-sm bg-secondary/20 p-4 rounded-lg italic leading-relaxed">{submission.abstractText}</p>
                </div>
                <a 
                  href={submission.pptPdfUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  <FileText className="h-4 w-4" /> View Submitted PPT
                </a>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-morphism relative overflow-hidden">
              {!isAdmin && (
                <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                  <div className="space-y-4 max-w-sm">
                    <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-primary">
                      <Lock className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-xl">Submissions Restricted</h3>
                    <p className="text-sm text-muted-foreground">This feature is currently locked. Please contact the administrator for further details.</p>
                  </div>
                </div>
              )}
              <CardHeader>
                <CardTitle>Submit Your Project</CardTitle>
                <p className="text-xs text-muted-foreground">Upload your solution details and PPT in PDF format.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Problem Statement</Label>
                  <Textarea 
                    placeholder="Briefly describe the problem you are solving..."
                    value={form.problemStatement} 
                    onChange={e => setForm({...form, problemStatement: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Abstract</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-accent h-7 gap-1"
                      onClick={handleAIAbstract}
                      disabled={isDrafting || !isAdmin}
                    >
                      {isDrafting ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      AI Draft
                    </Button>
                  </div>
                  <Textarea 
                    className="min-h-[150px]"
                    placeholder="Provide a summary of your solution..."
                    value={form.abstract} 
                    onChange={e => setForm({...form, abstract: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Upload PPT (PDF format only)</Label>
                  <Input 
                    type="file" 
                    accept=".pdf" 
                    onChange={e => setFile(e.target.files?.[0] || null)} 
                    className="bg-secondary/20"
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button 
                  className="w-full bg-primary font-bold h-12"
                  onClick={handleSubmission} 
                  disabled={isSubmitting || !file || !form.problemStatement || !form.abstract || !isAdmin}
                >
                  {isSubmitting ? <><LoaderCircle className="h-4 w-4 animate-spin mr-2" /> Submitting...</> : 'Submit Final Entry'}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
