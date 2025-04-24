import { Link, useLocation } from "wouter";
import { useEffect, useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MainLayout from "@/components/layouts/main-layout";
import { 
  Heart, 
  Image, 
  Calendar, 
  Newspaper, 
  Wallet, 
  Users, 
  Award, 
  BarChart, 
  Shield, 
  ChevronRight,
  ArrowUpRight,
  CheckCircle,
  Clock
} from "lucide-react";

export default function LandingPage() {
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslation('landing');
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      startTransition(() => {
        setLocation("/");
      });
    }
  }, [user, setLocation, startTransition]);

  const features = [
    {
      icon: <Heart className="h-10 w-10 text-primary" />,
      title: "Connexions Familiales",
      description: "Créez et renforcez les liens entre les générations grâce à notre plateforme familiale intuitive."
    },
    {
      icon: <Image className="h-10 w-10 text-primary" />,
      title: "Partage de Photos",
      description: "Partagez des moments précieux et créez des souvenirs durables pour toute la famille."
    },
    {
      icon: <Calendar className="h-10 w-10 text-primary" />,
      title: "Événements Familiaux",
      description: "Planifiez et organisez des rencontres, célébrations et événements importants pour votre famille."
    },
    {
      icon: <Newspaper className="h-10 w-10 text-primary" />,
      title: "Gazettes Familiales",
      description: "Créez des newsletters mensuelles pour partager des nouvelles et histoires avec vos proches."
    },
    {
      icon: <Wallet className="h-10 w-10 text-primary" />,
      title: "Gestion de Fonds",
      description: "Gérez facilement les finances familiales partagées pour les projets et événements communs."
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Invitations Simplifiées",
      description: "Invitez facilement de nouveaux membres à rejoindre votre cercle familial en quelques clics."
    }
  ];

  const testimonials = [
    {
      quote: "MyFamily a révolutionné la façon dont notre famille reste connectée malgré la distance. C'est incroyable de pouvoir partager notre quotidien si facilement.",
      author: "Marie L.",
      role: "Grand-mère de 4 petits-enfants"
    },
    {
      quote: "La gestion des fonds familiaux est devenue beaucoup plus transparente et simple avec MyFamily. Nous pouvons maintenant organiser nos événements sans tracas.",
      author: "Thomas B.",
      role: "Père de famille"
    },
    {
      quote: "J'adore recevoir les gazettes mensuelles. C'est comme avoir un journal familial personnalisé qui rassemble toutes nos histoires!",
      author: "Sophie M.",
      role: "Tante éloignée"
    }
  ];

  const pricingPlans = [
    {
      name: "Essentiel",
      price: "Gratuit",
      description: "Pour les petites familles qui débutent",
      features: [
        "Jusqu'à 10 membres",
        "Partage de photos basique",
        "Calendrier d'événements",
        "1 groupe familial"
      ]
    },
    {
      name: "Famille",
      price: "9,99€ /mois",
      description: "Pour les familles qui veulent plus de fonctionnalités",
      features: [
        "Jusqu'à 30 membres",
        "Gazettes familiales illimitées",
        "Édition photo avancée",
        "Gestion de fonds familiaux",
        "3 groupes familiaux"
      ],
      highlighted: true
    },
    {
      name: "Premium",
      price: "19,99€ /mois",
      description: "Pour les grandes familles et les événements importants",
      features: [
        "Membres illimités",
        "Stockage photos illimité",
        "Outils avancés d'organisation",
        "Groupes familiaux illimités",
        "Support prioritaire"
      ]
    }
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-[#F5F5F5]">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="inline-block rounded-lg bg-[#4A90E2]/10 px-3 py-1 text-sm text-[#1F3A93]">
                {t('hero.badge')}
              </div>
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-[#333333]">
                {t('hero.title')}
              </h1>
              <p className="max-w-[600px] text-[#333333] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t('hero.description')}
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/auth?tab=register">
                  <button className="btn-primary inline-flex items-center gap-1 px-6 py-3 text-lg">
                    {t('hero.startFree')}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </Link>
                <Link href="/features">
                  <button className="btn-secondary inline-flex items-center gap-1 px-6 py-3 text-lg">
                    {t('hero.discoverFeatures')}
                  </button>
                </Link>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#333333]">
                <CheckCircle className="h-4 w-4 text-[#1F3A93]" />
                <span>{t('hero.noCreditCard')}</span>
                <span className="mx-2">•</span>
                <Clock className="h-4 w-4 text-[#1F3A93]" />
                <span>{t('hero.quickSetup')}</span>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-[350px] w-full md:h-[420px] lg:h-[450px]">
                <div className="absolute inset-0 bg-gradient-to-r from-[#1F3A93] to-[#4A90E2] rounded-lg opacity-10 blur-3xl"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-[320px] w-[300px] md:h-[380px] md:w-[350px] bg-white rounded-xl shadow-2xl overflow-hidden border">
                    <div className="h-full w-full bg-gradient-to-br from-[#4A90E2]/30 to-[#1F3A93]/30 flex items-center justify-center">
                      <div className="text-center p-6">
                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/90 mb-4">
                          <Heart className="h-10 w-10 text-[#FF6F61]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">MyFamily</h3>
                        <p className="text-white/90 mb-6">Votre espace familial en ligne</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <div className="h-10 w-10 rounded-full bg-white/20"></div>
                          <div className="h-10 w-10 rounded-full bg-white/20"></div>
                          <div className="h-10 w-10 rounded-full bg-white/20"></div>
                          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white">+</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-[#333333] font-montserrat">
              Fonctionnalités conçues pour les familles modernes
            </h2>
            <p className="mt-4 text-[#333333] md:text-xl font-opensans">
              Des outils simples mais puissants pour renforcer vos liens familiaux
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card-myfamily p-6 flex flex-col items-center text-center">
                <div className="mb-4 p-3 rounded-full bg-[#4A90E2]/10">
                  <div className="text-[#1F3A93]">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#333333] font-montserrat">{feature.title}</h3>
                <p className="text-[#333333] font-opensans">{feature.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/features">
              <button className="btn-secondary inline-flex items-center gap-1 px-6 py-3">
                Toutes les fonctionnalités
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-[#F5F5F5]">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-[#333333] font-montserrat">
              Ce que nos utilisateurs disent
            </h2>
            <p className="mt-4 text-[#333333] md:text-xl font-opensans">
              Découvrez comment MyFamily transforme la vie de famille
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6 border border-gray-100">
                <div className="mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="inline-block h-5 w-5 fill-[#FF6F61]" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="mb-4 italic text-[#333333] font-opensans">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-[#1F3A93] font-montserrat">{testimonial.author}</p>
                  <p className="text-sm text-[#333333]/70 font-opensans">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/testimonials">
              <button className="btn-secondary inline-flex items-center gap-1 px-6 py-3">
                Voir plus de témoignages
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-[#333333] font-montserrat">
              Plans simples et transparents
            </h2>
            <p className="mt-4 text-[#333333] md:text-xl font-opensans">
              Choisissez le plan qui convient à votre famille
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`card-myfamily flex flex-col p-0 ${plan.highlighted ? 'border-[#1F3A93] shadow-lg relative' : ''}`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1F3A93] text-white text-sm font-medium py-1 px-3 rounded-full">
                    Le plus populaire
                  </div>
                )}
                <div className="p-6 border-b">
                  <h3 className="text-xl font-bold text-[#333333] font-montserrat">{plan.name}</h3>
                  <p className="text-[#333333]/70 text-sm mb-3 font-opensans">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-[#1F3A93] font-montserrat">{plan.price}</span>
                  </div>
                </div>
                <div className="p-6 flex-1">
                  <ul className="space-y-3 font-opensans">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4A90E2] mr-2 flex-shrink-0" />
                        <span className="text-[#333333]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 pt-0 mt-auto border-t">
                  <Link href={plan.price === "Gratuit" ? "/auth?tab=register" : "/pricing"}>
                    {plan.highlighted ? (
                      <button className="btn-primary w-full">
                        {plan.price === "Gratuit" ? "Commencer" : "Choisir"}
                      </button>
                    ) : (
                      <button className="btn-secondary w-full">
                        {plan.price === "Gratuit" ? "Commencer" : "Choisir"}
                      </button>
                    )}
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center text-sm">
            <p className="text-[#333333]/70 font-opensans">Tous les prix sont indiqués TTC. Annulez à tout moment.</p>
            <p className="mt-1 font-opensans">Besoin d'une solution personnalisée pour votre organisation ? 
              <Link href="/contact">
                <span className="text-[#1F3A93] hover:underline ml-1 cursor-pointer">Contactez-nous</span>
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-[#1F3A93] text-white">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-montserrat">
                Prêt à réunir votre famille ?
              </h2>
              <p className="mt-4 text-white/90 md:text-xl max-w-md font-opensans">
                Créez votre espace familial gratuit aujourd'hui et commencez à partager des moments précieux avec vos proches.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end">
              <Link href="/auth?tab=register">
                <button className="bg-[#FF6F61] text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-[#e86557] transition-colors w-full sm:w-auto">
                  Démarrer gratuitement
                </button>
              </Link>
              <Link href="/contact">
                <button className="border border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors w-full sm:w-auto">
                  Nous contacter
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-[#4A90E2]/10 p-4">
                <Shield className="h-8 w-8 text-[#1F3A93]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#333333] font-montserrat">Confidentialité garantie</h3>
              <p className="text-[#333333] font-opensans">
                Vos données familiales restent privées et sécurisées. Nous ne partageons jamais vos informations.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-[#4A90E2]/10 p-4">
                <Award className="h-8 w-8 text-[#1F3A93]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#333333] font-montserrat">Expérience familiale unique</h3>
              <p className="text-[#333333] font-opensans">
                Une plateforme conçue spécifiquement pour les familles, avec des fonctionnalités adaptées à vos besoins.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-[#4A90E2]/10 p-4">
                <BarChart className="h-8 w-8 text-[#1F3A93]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#333333] font-montserrat">Mises à jour régulières</h3>
              <p className="text-[#333333] font-opensans">
                Nous améliorons constamment notre plateforme avec de nouvelles fonctionnalités basées sur vos retours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}