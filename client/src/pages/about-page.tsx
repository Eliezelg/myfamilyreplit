import MainLayout from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Heart,
  Users,
  Globe,
  Clock,
  CheckCircle,
  Award,
  ArrowUpRight
} from "lucide-react";

export default function AboutPage() {
  const team = [
    {
      name: "Marie Laurent",
      role: "Fondatrice & CEO",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&auto=format&fit=crop&q=80",
      bio: "Passionnée par la technologie qui renforce les liens humains, Marie a fondé MyFamily avec l'idée de connecter les générations."
    },
    {
      name: "Thomas Dubois",
      role: "Directeur Technique",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&auto=format&fit=crop&q=80",
      bio: "Avec plus de 15 ans d'expérience dans le développement web, Thomas dirige l'innovation technique chez MyFamily."
    },
    {
      name: "Sarah Benali",
      role: "Responsable Design",
      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&auto=format&fit=crop&q=80",
      bio: "Designer UX/UI avec une passion pour les expériences intuitives et accessibles à tous les âges."
    },
    {
      name: "Alexandre Chen",
      role: "Responsable Marketing",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&auto=format&fit=crop&q=80",
      bio: "Spécialiste du marketing familial, Alexandre aide à faire croître la communauté MyFamily."
    }
  ];

  const timeline = [
    {
      year: "2020",
      title: "L'idée naît",
      description: "Pendant la pandémie, Marie réalise le besoin de solutions pour maintenir les liens familiaux à distance."
    },
    {
      year: "2021",
      title: "Création de MyFamily",
      description: "Fondation de l'entreprise et début du développement de la plateforme."
    },
    {
      year: "2022",
      title: "Lancement de la version beta",
      description: "Premiers utilisateurs et tests de la plateforme avec des familles volontaires."
    },
    {
      year: "2023",
      title: "Lancement officiel",
      description: "MyFamily est officiellement lancé avec toutes ses fonctionnalités principales."
    },
    {
      year: "2024",
      title: "Expansion internationale",
      description: "La plateforme devient disponible en plusieurs langues et s'étend à l'international."
    },
    {
      year: "2025",
      title: "1 million d'utilisateurs",
      description: "MyFamily célèbre sa communauté grandissante avec plus d'un million d'utilisateurs actifs."
    }
  ];

  const values = [
    {
      icon: <Heart className="h-10 w-10 text-primary" />,
      title: "Famille avant tout",
      description: "Nous concevons chaque fonctionnalité en pensant à l'unité et au bien-être des familles."
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Inclusivité",
      description: "Notre plateforme est conçue pour être accessible et utile pour toutes les générations."
    },
    {
      icon: <Globe className="h-10 w-10 text-primary" />,
      title: "Impact global",
      description: "Nous aspirons à connecter les familles partout dans le monde, au-delà des frontières."
    },
    {
      icon: <Clock className="h-10 w-10 text-primary" />,
      title: "Préservation de l'héritage",
      description: "Nous aidons les familles à préserver leur histoire et leurs traditions pour les générations futures."
    }
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Notre Histoire
          </h1>
          <p className="mt-4 text-muted-foreground md:text-xl max-w-2xl mx-auto">
            Découvrez comment MyFamily est né d'une passion pour renforcer les liens familiaux et préserver les souvenirs à travers les générations.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter">Notre Mission</h2>
              <p className="text-muted-foreground">
                Chez MyFamily, notre mission est de renforcer les liens familiaux à travers la technologie, en créant un espace numérique où toutes les générations peuvent se connecter, partager et préserver leur héritage familial.
              </p>
              <p className="text-muted-foreground">
                Nous croyons que la famille est le pilier de notre société, et nous nous engageons à fournir des outils intuitifs qui facilitent la communication et le partage d'expériences, peu importe l'âge ou la distance.
              </p>
              <div className="pt-4">
                <Link href="/contact">
                  <Button className="gap-2">
                    Contactez-nous
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-400 rounded-lg opacity-10 blur-3xl"></div>
              <div className="relative bg-muted/40 rounded-lg p-6 shadow-lg">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-background rounded-md p-4 shadow-sm">
                    <h3 className="font-bold text-2xl mb-2">100+</h3>
                    <p className="text-muted-foreground">Pays où MyFamily est utilisé</p>
                  </div>
                  <div className="bg-background rounded-md p-4 shadow-sm">
                    <h3 className="font-bold text-2xl mb-2">1M+</h3>
                    <p className="text-muted-foreground">Utilisateurs actifs</p>
                  </div>
                  <div className="bg-background rounded-md p-4 shadow-sm">
                    <h3 className="font-bold text-2xl mb-2">5M+</h3>
                    <p className="text-muted-foreground">Photos partagées</p>
                  </div>
                  <div className="bg-background rounded-md p-4 shadow-sm">
                    <h3 className="font-bold text-2xl mb-2">300K+</h3>
                    <p className="text-muted-foreground">Événements organisés</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24 bg-muted/20">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter">Nos Valeurs</h2>
            <p className="mt-4 text-muted-foreground md:text-xl max-w-2xl mx-auto">
              Les principes qui guident nos décisions et façonnent notre culture d'entreprise
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-background rounded-lg p-6 shadow-sm text-center">
                <div className="mb-4 flex justify-center">{value.icon}</div>
                <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter">Notre Parcours</h2>
            <p className="mt-4 text-muted-foreground md:text-xl max-w-2xl mx-auto">
              L'évolution de MyFamily depuis sa création jusqu'à aujourd'hui
            </p>
          </div>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-primary/20"></div>
            
            <div className="relative">
              {timeline.map((item, index) => (
                <div key={index} className={`mb-12 flex items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                  <div className="md:w-1/2 flex flex-col items-center md:items-end gap-2 z-10">
                    <div className={`text-center ${index % 2 === 0 ? 'md:text-left' : 'md:text-right'} md:px-8`}>
                      <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-2">
                        {item.year}
                      </span>
                      <h3 className="text-xl font-bold">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <div className="hidden md:block md:w-1/2"></div>
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-primary"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-24 bg-muted/20">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter">Notre Équipe</h2>
            <p className="mt-4 text-muted-foreground md:text-xl max-w-2xl mx-auto">
              Les personnes passionnées qui font de MyFamily une réalité
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-background rounded-lg shadow-sm overflow-hidden">
                <div className="aspect-square relative">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-lg font-bold">{member.name}</h3>
                  <p className="text-primary text-sm mb-2">{member.role}</p>
                  <p className="text-muted-foreground text-sm">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Rejoignez la communauté MyFamily
          </h2>
          <p className="mt-4 text-primary-foreground/90 md:text-xl max-w-2xl mx-auto">
            Faites partie de notre histoire en créant votre espace familial dès aujourd'hui.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth?tab=register">
              <Button size="lg" variant="secondary">
                Démarrer gratuitement
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline" className="border-primary-foreground/20 hover:bg-primary-foreground/10">
                Découvrir les fonctionnalités
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}