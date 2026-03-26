
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowRight, Code, Users, Rocket, Calendar } from "lucide-react";
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-morphism border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Rocket className="text-white h-5 w-5" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight">Hackathon Horizon</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/register" className="text-sm font-medium hover:text-primary transition-colors">Register</Link>
          <Link href="/dashboard">
            <Button variant="default" className="bg-primary hover:bg-primary/90">Sign In</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative z-10 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <Calendar className="h-4 w-4" />
              <span>Deadline: April 6th, 2024</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tighter">
              The Next Frontier <br />
              <span className="text-primary italic">Starts Here.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              Join visionary developers, designers, and innovators at Hackathon Horizon. Turn your boldest ideas into reality and compete for a spot in tech history.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 text-lg gap-2 bg-primary">
                  Register Your Team <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-primary/20 hover:bg-primary/5">
                Learn More
              </Button>
            </div>
          </div>
          <div className="relative hidden lg:block animate-in fade-in zoom-in duration-1000">
             <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 border border-white/5">
                <Image 
                  src="https://picsum.photos/seed/horizon-hero/1200/800"
                  alt="Hackathon Horizon Hero"
                  fill
                  className="object-cover"
                  data-ai-hint="futuristic technology"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-background via-transparent to-transparent opacity-60" />
             </div>
             {/* Decorative element */}
             <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
             <div className="absolute -top-6 -left-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-secondary/30 border-y">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center space-y-1">
            <p className="text-3xl font-bold text-primary">500+</p>
            <p className="text-sm text-muted-foreground uppercase tracking-widest">Hackers</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-3xl font-bold text-primary">36h</p>
            <p className="text-sm text-muted-foreground uppercase tracking-widest">Hacking</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-3xl font-bold text-primary">$10k</p>
            <p className="text-sm text-muted-foreground uppercase tracking-widest">Prizes</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-3xl font-bold text-primary">20+</p>
            <p className="text-sm text-muted-foreground uppercase tracking-widest">Sponsors</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16 font-headline">Why Hackathon Horizon?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Users className="h-8 w-8 text-accent" />,
              title: "Team Collaboration",
              desc: "Form teams of up to 4 members. Share the workload, double the innovation."
            },
            {
              icon: <Code className="h-8 w-8 text-accent" />,
              title: "Expert Mentorship",
              desc: "Get guidance from industry leaders through live sessions and workshops."
            },
            {
              icon: <Rocket className="h-8 w-8 text-accent" />,
              title: "Launchpad",
              desc: "Top projects get the chance to pitch to real VCs and angel investors."
            }
          ].map((feature, i) => (
            <div key={i} className="p-8 rounded-2xl bg-card border hover:border-primary/50 transition-all group">
              <div className="mb-6 p-3 rounded-lg bg-secondary w-fit group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-4 font-headline">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Rocket className="text-primary h-6 w-6" />
            <span className="font-bold text-lg font-headline">Hackathon Horizon</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 Hackathon Horizon. Built with passion.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Twitter</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Discord</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
