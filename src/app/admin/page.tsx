
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  useFirestore, 
  useUser,
  useMemoFirebase,
  useCollection
} from '@/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  endBefore, 
  limitToLast,
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer,
} from 'firebase/firestore';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  LoaderCircle, 
  Download, 
  ShieldCheck, 
  Lock, 
  ChevronLeft, 
  ChevronRight,
  FileSpreadsheet,
  Search,
  FileText,
  RefreshCcw,
  Database,
  Users as UsersIcon,
  ExternalLink,
  User as UserIcon,
  Mail,
  Phone,
  School,
  BookOpen,
  GraduationCap
} from "lucide-react";
import Link from 'next/link';
import { Separator } from "@/components/ui/separator";

// Authorized admin list
const ADMIN_EMAILS = ["rishikeshavjha51@gmail.com"]; 

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [totalTeams, setTotalTeams] = useState<number>(0);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const firstDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [isFullCsvExporting, setIsFullCsvExporting] = useState(false);
  const [isSqlExporting, setIsSqlExporting] = useState(false);
  const [isFullSqlExporting, setIsFullSqlExporting] = useState(false);

  const PAGE_SIZE = 50;

  const isAuthorized = !!(user?.email && ADMIN_EMAILS.includes(user.email));

  const formatToMySQLDateTime = (isoString: string | null | undefined) => {
    if (!isoString) return 'NULL';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'NULL';
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    } catch (e) {
      return 'NULL';
    }
  };

  const fetchTotalCount = useCallback(async () => {
    if (!isAuthorized || !db) return;
    try {
      const coll = collection(db, 'users');
      const snapshot = await getCountFromServer(coll);
      setTotalTeams(snapshot.data().count);
    } catch (error) {}
  }, [db, isAuthorized]);

  const fetchPage = useCallback(async (direction: 'next' | 'prev' | 'initial' | 'refresh') => {
    if (!isAuthorized || !db) return;
    setIsDataLoading(true);

    try {
      let q;
      const baseCol = collection(db, 'users');
      
      if (direction === 'next' && lastDocRef.current) {
        q = query(baseCol, orderBy('registrationDateTime', 'asc'), startAfter(lastDocRef.current), limit(PAGE_SIZE));
      } else if (direction === 'prev' && firstDocRef.current) {
        q = query(baseCol, orderBy('registrationDateTime', 'asc'), endBefore(firstDocRef.current), limitToLast(PAGE_SIZE));
      } else {
        q = query(baseCol, orderBy('registrationDateTime', 'asc'), limit(PAGE_SIZE));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      
      if (docs.length > 0) {
        firstDocRef.current = docs[0];
        lastDocRef.current = docs[docs.length - 1];
        setRegistrations(docs.map(d => ({ ...d.data(), id: d.id })));
        
        const nextCheckQ = query(baseCol, orderBy('registrationDateTime', 'asc'), startAfter(docs[docs.length - 1]), limit(1));
        const nextSnapshot = await getDocs(nextCheckQ);
        setHasMore(!nextSnapshot.empty);
      } else {
        if (direction === 'initial' || direction === 'refresh') setRegistrations([]);
        setHasMore(false);
      }

      if (direction === 'next') setPage(p => p + 1);
      if (direction === 'prev') setPage(p => Math.max(1, p - 1));
      if (direction === 'initial' || direction === 'refresh') setPage(1);
    } catch (error) {} finally {
      setIsDataLoading(false);
    }
  }, [isAuthorized, db]);

  useEffect(() => {
    if (isAuthorized) {
      fetchPage('initial');
      fetchTotalCount();
    }
  }, [isAuthorized, fetchPage, fetchTotalCount]);

  const handleExport = async (isFull: boolean, type: 'csv' | 'sql') => {
    const setExporting = type === 'csv' ? (isFull ? setIsFullCsvExporting : setIsExporting) : (isFull ? setIsFullSqlExporting : setIsSqlExporting);
    setExporting(true);

    try {
      let dataToProcess = registrations;
      if (isFull) {
        const q = query(collection(db, 'users'), orderBy('registrationDateTime', 'asc'));
        const snapshot = await getDocs(q);
        dataToProcess = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      }

      if (dataToProcess.length === 0) {
        setExporting(false);
        return;
      }

      if (type === 'csv') {
        const rows = [];
        for (const leader of dataToProcess) {
          const membersSnap = await getDocs(collection(db, 'users', leader.id, 'teamMembers'));
          const members = membersSnap.docs.map(d => d.data());
          const subSnap = await getDocs(collection(db, 'users', leader.id, 'projectSubmissions'));
          const sub = subSnap.docs[0]?.data() || {};
          
          const pdf = sub.pptPdfUrl || sub.pdfLink || sub.pdfURL || leader.pdfLink || leader.pptPdfUrl || leader.pdfURL || '';

          const row: any = {
            id: leader.id,
            teamName: leader.teamName || '',
            leaderName: leader.name || '',
            leaderEmail: leader.email || '',
            leaderPhone: leader.phone || leader.phoneNumber || '',
            college: leader.college || '',
            degree: leader.degree || '',
            branch: leader.branch || '',
            registrationDate: formatToMySQLDateTime(leader.registrationDateTime),
            problem: (sub.problemStatement || '').replace(/\r?\n|\r/g, ' '),
            abstract: (sub.abstractText || sub.solutionSummary || '').replace(/\r?\n|\r/g, ' '),
            pdfUrl: pdf,
          };

          for (let i = 0; i < 3; i++) {
            const m = members[i] || {};
            row[`member${i+1}Name`] = m.name || '';
            row[`member${i+1}Email`] = m.email || '';
            row[`member${i+1}Phone`] = m.phone || m.phoneNumber || '';
          }
          rows.push(row);
        }

        const headers = Object.keys(rows[0]).join(',');
        const content = rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([`${headers}\n${content}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hackathon_${isFull ? 'master' : 'current'}.csv`;
        link.click();
      } else {
        let sql = `CREATE TABLE IF NOT EXISTS team_leaders (\n  id VARCHAR(255) PRIMARY KEY,\n  team_name VARCHAR(255),\n  name VARCHAR(255),\n  email VARCHAR(255),\n  phone VARCHAR(255),\n  college VARCHAR(255),\n  degree VARCHAR(255),\n  branch VARCHAR(255),\n  gender VARCHAR(255),\n  year VARCHAR(255),\n  linkedin_url TEXT,\n  github_url TEXT,\n  registration_date DATETIME\n);\n\n`;
        sql += `CREATE TABLE IF NOT EXISTS team_members (\n  id VARCHAR(255) PRIMARY KEY,\n  leader_id VARCHAR(255),\n  name VARCHAR(255),\n  email VARCHAR(255),\n  phone VARCHAR(255),\n  college VARCHAR(255),\n  degree VARCHAR(255),\n  branch VARCHAR(255),\n  gender VARCHAR(255),\n  year VARCHAR(255),\n  linkedin_url TEXT\n);\n\n`;
        sql += `CREATE TABLE IF NOT EXISTS project_submissions (\n  id VARCHAR(255) PRIMARY KEY,\n  leader_id VARCHAR(255),\n  problem_statement TEXT,\n  abstract_text TEXT,\n  pdf_url TEXT,\n  submission_date DATETIME\n);\n\n`;

        const esc = (v: any) => v ? `'${String(v).replace(/'/g, "''")}'` : 'NULL';

        for (const leader of dataToProcess) {
          sql += `INSERT INTO team_leaders (id, team_name, name, email, phone, college, degree, branch, gender, year, linkedin_url, github_url, registration_date) VALUES (\n  ${esc(leader.id)}, ${esc(leader.teamName)}, ${esc(leader.name)}, ${esc(leader.email)}, \n  ${esc(leader.phone || leader.phoneNumber)}, ${esc(leader.college)}, ${esc(leader.degree)}, \n  ${esc(leader.branch)}, ${esc(leader.gender)}, ${esc(leader.year)}, \n  ${esc(leader.linkedinProfileUrl || leader.linkedin)}, ${esc(leader.githubProfileUrl || leader.github)}, '${formatToMySQLDateTime(leader.registrationDateTime)}'\n);\n`;

          const mSnap = await getDocs(collection(db, 'users', leader.id, 'teamMembers'));
          for (const mDoc of mSnap.docs) {
            const m = mDoc.data();
            sql += `INSERT INTO team_members (id, leader_id, name, email, phone, college, degree, branch, gender, year, linkedin_url) VALUES (\n  ${esc(mDoc.id)}, ${esc(leader.id)}, ${esc(m.name)}, ${esc(m.email)}, ${esc(m.phone || m.phoneNumber)}, ${esc(m.college)}, ${esc(m.degree)}, ${esc(m.branch)}, ${esc(m.gender)}, ${esc(m.year)}, ${esc(m.linkedinProfileUrl || m.linkedin)}\n);\n`;
          }

          const sSnap = await getDocs(collection(db, 'users', leader.id, 'projectSubmissions'));
          const s = sSnap.docs[0]?.data() || {};
          const pdf = s.pptPdfUrl || s.pdfLink || s.pdfURL || leader.pdfLink || leader.pptPdfUrl || leader.pdfURL || '';
          
          if (pdf || s.problemStatement) {
            sql += `INSERT INTO project_submissions (id, leader_id, problem_statement, abstract_text, pdf_url, submission_date) VALUES (\n  ${esc(sSnap.docs[0]?.id || 'sub_' + leader.id)}, ${esc(leader.id)}, ${esc(s.problemStatement)}, ${esc(s.abstractText || s.solutionSummary)}, ${esc(pdf)}, '${formatToMySQLDateTime(s.submissionDateTime || leader.registrationDateTime)}'\n);\n`;
          }
          sql += `\n`;
        }
        const blob = new Blob([sql], { type: 'application/sql' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hackathon_${isFull ? 'master' : 'current'}.sql`;
        link.click();
      }
    } catch (e) {
    } finally {
      setIsFullCsvExporting(false);
      setIsSqlExporting(false);
      setIsFullSqlExporting(false);
      setIsExporting(false);
    }
  };

  const filtered = registrations.filter(r => 
    r.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.college?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isAuthorized) return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <Card className="max-w-md w-full glass-morphism border-destructive/20 text-center p-8">
        <Lock className="text-destructive h-12 w-12 mx-auto mb-4" />
        <CardTitle>Access Denied</CardTitle>
        <p className="text-muted-foreground mt-2 mb-6">Administrators only.</p>
        <Link href="/dashboard"><Button variant="outline" className="w-full">Go to Dashboard</Button></Link>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><ShieldCheck className="h-6 w-6" /></div>
            <div>
              <h1 className="text-3xl font-bold font-headline">Evaluation Panel</h1>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <UsersIcon className="h-3 w-3" />
                <span>Total Teams Formed: <strong>{totalTeams}</strong></span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => { fetchPage('refresh'); fetchTotalCount(); }} disabled={isDataLoading}>
              <RefreshCcw className={`h-4 w-4 mr-2 ${isDataLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport(false, 'csv')} disabled={isExporting}><Download className="h-4 w-4 mr-2" /> Current CSV</Button>
            <Button variant="outline" size="sm" onClick={() => handleExport(false, 'sql')} disabled={isSqlExporting}><Database className="h-4 w-4 mr-2" /> Current SQL</Button>
            <Button variant="outline" size="sm" className="text-accent border-accent/20" onClick={() => handleExport(true, 'csv')} disabled={isFullCsvExporting}><FileSpreadsheet className="h-4 w-4 mr-2" /> Master CSV</Button>
            <Button size="sm" className="bg-primary" onClick={() => handleExport(true, 'sql')} disabled={isFullSqlExporting}><Database className="h-4 w-4 mr-2" /> Master SQL</Button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search teams, IDs, or colleges..." className="pl-10 bg-secondary/20" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <Card className="glass-morphism border-white/5 overflow-x-auto">
          <CardContent className="pt-6 min-w-[800px]">
            <Table>
              <TableHeader className="bg-secondary/20">
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Leader ID</TableHead>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead className="text-right">Project</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isDataLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-20"><LoaderCircle className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filtered.map((reg, idx) => (
                  <TableRow key={reg.id}>
                    <TableCell className="text-muted-foreground font-mono">#{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground break-all">{reg.id}</TableCell>
                    <TableCell>
                      <TeamDetailsDialog team={reg} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col"><span className="font-medium text-xs">{reg.name}</span><span className="text-[10px] text-muted-foreground">{reg.email}</span></div>
                    </TableCell>
                    <TableCell className="text-xs">{reg.college}</TableCell>
                    <TableCell className="font-mono text-xs">{formatToMySQLDateTime(reg.registrationDateTime)}</TableCell>
                    <TableCell className="text-right"><SubmissionStatus leader={reg} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">Showing {(page - 1) * PAGE_SIZE + 1} - {(page - 1) * PAGE_SIZE + filtered.length}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1 || isDataLoading} onClick={() => fetchPage('prev')}><ChevronLeft className="h-4 w-4 mr-1" /> Prev</Button>
                <Button variant="outline" size="sm" disabled={!hasMore || isDataLoading} onClick={() => fetchPage('next')}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TeamDetailsDialog({ team }: { team: any }) {
  const db = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [sub, setSub] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const mSnap = await getDocs(collection(db, 'users', team.id, 'teamMembers'));
      setMembers(mSnap.docs.map(d => d.data()));
      const sSnap = await getDocs(collection(db, 'users', team.id, 'projectSubmissions'));
      setSub(sSnap.docs[0]?.data() || null);
    } catch (e) {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen]);

  const pdf = sub?.pptPdfUrl || sub?.pdfLink || sub?.pdfURL || team.pdfLink || team.pptPdfUrl || team.pdfURL;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="font-bold text-primary hover:underline flex items-center gap-1 group">
          {team.teamName} <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline flex items-center gap-2">
            Team: <span className="text-primary">{team.teamName}</span>
          </DialogTitle>
          <div className="text-xs text-muted-foreground font-mono">UID: {team.id}</div>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-20 text-center"><LoaderCircle className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : (
          <div className="space-y-8 py-4">
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <UserIcon className="h-4 w-4" /> Team Leader
              </h3>
              <div className="grid md:grid-cols-2 gap-4 bg-secondary/20 p-4 rounded-xl border">
                <InfoItem icon={<UserIcon />} label="Full Name" value={team.name} />
                <InfoItem icon={<Mail />} label="Email" value={team.email} />
                <InfoItem icon={<Phone />} label="Phone" value={team.phone || team.phoneNumber} />
                <InfoItem icon={<School />} label="College" value={team.college} />
                <InfoItem icon={<GraduationCap />} label="Degree" value={team.degree} />
                <InfoItem icon={<BookOpen />} label="Branch" value={team.branch} />
                <div className="md:col-span-2 flex gap-4 mt-2">
                  {team.linkedinProfileUrl && <a href={team.linkedinProfileUrl} target="_blank" className="text-xs text-primary hover:underline">LinkedIn</a>}
                  {team.githubProfileUrl && <a href={team.githubProfileUrl} target="_blank" className="text-xs text-primary hover:underline">GitHub</a>}
                </div>
              </div>
            </section>

            {members.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <UsersIcon className="h-4 w-4" /> Team Members ({members.length})
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {members.map((m, i) => (
                    <div key={i} className="bg-secondary/10 p-4 rounded-xl border text-sm space-y-2">
                      <p className="font-bold">{m.name}</p>
                      <p className="text-muted-foreground text-xs">{m.email} • {m.year}</p>
                      <p className="text-xs">{m.branch} • {m.college}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <FileText className="h-4 w-4" /> Project Submission
              </h3>
              {sub || team.solutionSummary ? (
                <div className="space-y-4 bg-primary/5 p-6 rounded-xl border border-primary/20">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Problem Statement</label>
                    <p className="text-sm">{sub?.problemStatement || "N/A"}</p>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Abstract / Summary</label>
                    <p className="text-sm italic">{sub?.abstractText || team.solutionSummary || "N/A"}</p>
                  </div>
                  {pdf && (
                    <div className="pt-4">
                      <a href={pdf} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
                        <FileText className="h-4 w-4" /> View PPT (PDF)
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center bg-secondary/10 rounded-xl border border-dashed text-muted-foreground text-sm">
                  No submission details yet.
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-1.5 bg-background rounded text-muted-foreground [&_svg]:size-3.5 mt-0.5">{icon}</div>
      <div>
        <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || 'N/A'}</p>
      </div>
    </div>
  );
}

function SubmissionStatus({ leader }: { leader: any }) {
  const db = useFirestore();
  const subQuery = useMemoFirebase(() => collection(db, 'users', leader.id, 'projectSubmissions'), [db, leader.id]);
  const { data: subs, isLoading } = useCollection(subQuery);

  if (isLoading) return <LoaderCircle className="h-3 w-3 animate-spin ml-auto" />;
  
  const pdf = subs?.[0]?.pptPdfUrl || subs?.[0]?.pdfLink || subs?.[0]?.pdfURL || leader.pdfLink || leader.pptPdfUrl || leader.pdfURL;

  if (!pdf) return <span className="text-[10px] text-muted-foreground italic">Pending</span>;
  return <a href={pdf} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-primary uppercase hover:underline flex items-center gap-1 justify-end"><FileText className="h-3 w-3" /> View PDF</a>;
}
