import MainLayout from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Heart,
  Image,
  Calendar,
  Newspaper,
  Wallet,
  Users,
  Lock,
  Smartphone,
  Bell,
  Clock,
  Settings,
  MessageSquare,
  Search,
  Share,
  Edit,
  ArrowRight,
  ChevronRight
} from "lucide-react";

export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: <Heart className="h-12 w-12 text-primary" />,
      title: "Connexions Familiales",
      description: "Créez et renforcez les liens entre les générations avec un espace familial partagé qui permet des interactions quotidiennes significatives.",
      benefits: [
        "Invitez facilement tous les membres de votre famille",
        "Créez plusieurs cercles familiaux distincts",
        "Personnalisez les permissions selon les membres"
      ]
    },
    {
      icon: <Image className="h-12 w-12 text-primary" />,
      title: "Partage de Photos",
      description: "Partagez vos moments précieux avec notre système de partage de photos avancé, conçu pour préserver les souvenirs familiaux.",
      benefits: [
        "Stockage haute qualité pour vos souvenirs",
        "Organisation par albums et collections",
        "Ajout de légendes et identification des personnes"
      ]
    },
    {
      icon: <Calendar className="h-12 w-12 text-primary" />,
      title: "Événements Familiaux",
      description: "Planifiez et organisez tous vos événements familiaux avec notre calendrier intuitif qui synchronise les agendas de tous les membres.",
      benefits: [
        "Rappels automatiques pour les anniversaires",
        "Planification collaborative d'événements",
        "Synchronisation avec vos calendriers habituels"
      ]
    },
    {
      icon: <Newspaper className="h-12 w-12 text-primary" />,
      title: "Gazettes Familiales",
      description: "Créez des newsletters mensuelles automatiques qui regroupent les activités, photos et événements importants de votre famille.",
      benefits: [
        "Génération automatique basée sur l'activité",
        "Personnalisation du design et du contenu",
        "Partage facile avec les membres éloignés"
      ]
    },
    {
      icon: <Wallet className="h-12 w-12 text-primary" />,
      title: "Gestion de Fonds",
      description: "Gérez les finances familiales partagées pour les projets communs, événements ou cadeaux collectifs en toute transparence.",
      benefits: [
        "Suivi des contributions de chaque membre",
        "Organisation des dépenses par projets",
        "Historique complet des transactions"
      ]
    },
    {
      icon: <Users className="h-12 w-12 text-primary" />,
      title: "Invitations Simplifiées",
      description: "Élargissez votre cercle familial avec notre système d'invitation simple qui permet à tous les membres de rejoindre l'espace familial.",
      benefits: [
        "Liens d'invitation personnalisés et sécurisés",
        "Processus d'intégration guidé pour les nouveaux membres",
        "Contrôle des niveaux d'accès par le créateur"
      ]
    }
  ];

  const additionalFeatures = [
    {
      icon: <Lock className="h-6 w-6 text-primary" />,
      title: "Sécurité et confidentialité avancées",
      description: "Protection des données familiales avec les normes de sécurité les plus strictes."
    },
    {
      icon: <Smartphone className="h-6 w-6 text-primary" />,
      title: "Application mobile",
      description: "Accédez à votre espace familial où que vous soyez avec notre application mobile intuitive."
    },
    {
      icon: <Bell className="h-6 w-6 text-primary" />,
      title: "Notifications personnalisées",
      description: "Choisissez quand et comment recevoir des notifications sur l'activité familiale."
    },
    {
      icon: <Clock className="h-6 w-6 text-primary" />,
      title: "Archives familiales",
      description: "Conservez et organisez chronologiquement tous les événements et souvenirs importants."
    },
    {
      icon: <Settings className="h-6 w-6 text-primary" />,
      title: "Personnalisation complète",
      description: "Adaptez l'interface et les fonctionnalités selon les préférences de votre famille."
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-primary" />,
      title: "Discussions familiales",
      description: "Échangez avec tous les membres à travers des discussions privées ou de groupe."
    },
    {
      icon: <Search className="h-6 w-6 text-primary" />,
      title: "Recherche intelligente",
      description: "Retrouvez rapidement n'importe quel contenu dans votre espace familial."
    },
    {
      icon: <Share className="h-6 w-6 text-primary" />,
      title: "Partage externe limité",
      description: "Partagez certains contenus avec des personnes extérieures de façon contrôlée."
    },
    {
      icon: <Edit className="h-6 w-6 text-primary" />,
      title: "Édition collaborative",
      description: "Travaillez ensemble sur les albums photos, événements et gazettes familiales."
    }
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Fonctionnalités conçues pour les familles modernes
            </h1>
            <p className="mt-6 text-muted-foreground md:text-xl">
              MyFamily offre toutes les fonctionnalités dont vous avez besoin pour renforcer les liens familiaux et préserver vos souvenirs précieux.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth?tab=register">
                <Button size="lg" className="gap-2">
                  Essayer maintenant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline">
                  Voir les tarifs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 gap-16">
            {mainFeatures.map((feature, index) => (
              <div 
                key={index} 
                className={`grid md:grid-cols-2 gap-8 items-center ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className={`${index % 2 === 1 ? 'md:order-2' : ''}`}>
                  <div className="inline-flex items-center justify-center p-3 rounded-lg bg-primary/10 mb-4">
                    {feature.icon}
                  </div>
                  <h2 className="text-3xl font-bold tracking-tighter mb-4">{feature.title}</h2>
                  <p className="text-muted-foreground mb-6">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start">
                        <ArrowRight className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`relative ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-400 rounded-lg opacity-10 blur-3xl"></div>
                  <div className="relative h-64 md:h-full aspect-video bg-muted/30 rounded-lg flex items-center justify-center shadow-lg overflow-hidden border">
                    <div className="bg-primary/20 p-8 rounded-full">
                      {feature.icon}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-16 md:py-24 bg-muted/20">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter">
              Et bien plus encore...
            </h2>
            <p className="mt-4 text-muted-foreground md:text-xl max-w-2xl mx-auto">
              MyFamily offre de nombreuses autres fonctionnalités pour améliorer votre expérience familiale
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="bg-background rounded-lg p-6 shadow-sm border">
                <div className="flex items-start">
                  <div className="mr-4 mt-1">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter">
              Comparaison des plans
            </h2>
            <p className="mt-4 text-muted-foreground md:text-xl max-w-2xl mx-auto">
              Choisissez le plan qui correspond le mieux aux besoins de votre famille
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-4 bg-muted/50">Fonctionnalité</th>
                  <th className="p-4 bg-muted/50 text-center">Essentiel</th>
                  <th className="p-4 bg-primary/10 text-center font-bold">Famille</th>
                  <th className="p-4 bg-muted/50 text-center">Premium</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4">Nombre de membres</td>
                  <td className="p-4 text-center">Jusqu'à 10</td>
                  <td className="p-4 text-center bg-primary/5">Jusqu'à 30</td>
                  <td className="p-4 text-center">Illimité</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Stockage photos</td>
                  <td className="p-4 text-center">5 GB</td>
                  <td className="p-4 text-center bg-primary/5">20 GB</td>
                  <td className="p-4 text-center">Illimité</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Groupes familiaux</td>
                  <td className="p-4 text-center">1</td>
                  <td className="p-4 text-center bg-primary/5">3</td>
                  <td className="p-4 text-center">Illimité</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Gazettes familiales</td>
                  <td className="p-4 text-center">Basique</td>
                  <td className="p-4 text-center bg-primary/5">Illimité</td>
                  <td className="p-4 text-center">Illimité</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Gestion de fonds</td>
                  <td className="p-4 text-center">
                    <svg className="w-5 h-5 text-muted-foreground mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </td>
                  <td className="p-4 text-center bg-primary/5">
                    <svg className="w-5 h-5 text-primary mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                  <td className="p-4 text-center">
                    <svg className="w-5 h-5 text-primary mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Support</td>
                  <td className="p-4 text-center">Email</td>
                  <td className="p-4 text-center bg-primary/5">Email & Chat</td>
                  <td className="p-4 text-center">Prioritaire</td>
                </tr>
                <tr>
                  <td className="p-4"></td>
                  <td className="p-4 text-center">
                    <Link href="/auth?tab=register">
                      <Button variant="outline">Démarrer</Button>
                    </Link>
                  </td>
                  <td className="p-4 text-center bg-primary/5">
                    <Link href="/pricing">
                      <Button>Choisir</Button>
                    </Link>
                  </td>
                  <td className="p-4 text-center">
                    <Link href="/pricing">
                      <Button variant="outline">Choisir</Button>
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 bg-muted/20">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter">
              Ce que disent nos utilisateurs
            </h2>
            <p className="mt-4 text-muted-foreground md:text-xl max-w-2xl mx-auto">
              Des milliers de familles profitent déjà des fonctionnalités de MyFamily
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 fill-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="italic text-muted-foreground mb-4">
                "La fonction de gazette mensuelle est extraordinaire. Nos grands-parents attendent avec impatience leur publication chaque mois pour suivre nos aventures."
              </p>
              <div>
                <p className="font-semibold">Camille D.</p>
                <p className="text-sm text-muted-foreground">Mère de 2 enfants</p>
              </div>
            </div>
            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 fill-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="italic text-muted-foreground mb-4">
                "Organiser notre réunion familiale annuelle est devenu tellement plus simple. La gestion des fonds et le calendrier partagé ont transformé notre façon de nous organiser."
              </p>
              <div>
                <p className="font-semibold">Patrick M.</p>
                <p className="text-sm text-muted-foreground">Organisateur familial</p>
              </div>
            </div>
            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 fill-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="italic text-muted-foreground mb-4">
                "À 78 ans, je peux enfin voir les photos de mes petits-enfants facilement. L'interface est simple même pour quelqu'un de ma génération."
              </p>
              <div>
                <p className="font-semibold">Jeanne L.</p>
                <p className="text-sm text-muted-foreground">Grand-mère comblée</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Prêt à connecter votre famille ?
          </h2>
          <p className="mt-4 text-primary-foreground/90 md:text-xl max-w-2xl mx-auto">
            Créez votre espace familial gratuitement et découvrez toutes nos fonctionnalités.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth?tab=register">
              <Button size="lg" variant="secondary" className="gap-2">
                Démarrer gratuitement
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-primary-foreground/20 hover:bg-primary-foreground/10">
                Nous contacter
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}