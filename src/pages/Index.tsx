import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Star, Shield, Clock, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { LocationSearchBar } from "@/components/search/LocationSearchBar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  {
    icon: Shield,
    title: "Verified Halal",
    description: "Every restaurant is verified for halal authenticity with detailed certification info.",
  },
  {
    icon: MapPin,
    title: "Nearby Discovery",
    description: "Find halal restaurants near you with our interactive map and smart location search.",
  },
  {
    icon: Star,
    title: "Community Reviews",
    description: "Real reviews from the Muslim community to help you choose the best spots.",
  },
  {
    icon: Clock,
    title: "Real-time Info",
    description: "Up-to-date hours, menus, and availability so you never arrive disappointed.",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSearch = (query: string) => {
    navigate(`/explore?q=${encodeURIComponent(query)}`);
  };

  const handleLocationSelect = (location: { name: string; lat: number; lng: number }) => {
    navigate(`/explore?lat=${location.lat}&lng=${location.lng}&location=${encodeURIComponent(location.name)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative hero-gradient overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-gold/5"
          />
        </div>

        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Shield className="h-4 w-4" />
                Trusted by the Muslim Community
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight"
            >
              Find{" "}
              <span className="text-gradient-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Halal Food
              </span>
              <br />
              Near You
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto"
            >
              Discover authentic halal restaurants in your area with verified certifications, 
              real reviews, and detailed halal information.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-xl mx-auto mb-8"
            >
              <LocationSearchBar
                placeholder="Enter your city or zip code..."
                onSearch={handleSearch}
                onLocationSelect={handleLocationSelect}
                size="large"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/explore')}
                className="gap-2 group"
              >
                Explore Map
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why HalalBytes?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We make finding halal food simple, reliable, and community-driven.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group p-6 rounded-2xl bg-card border hover:shadow-elevated transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Know a Halal Restaurant?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
              Help the community by submitting restaurants you know. 
              Together, we can build the most comprehensive halal food directory.
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate(user ? '/submit-restaurant' : '/auth/signup')}
              className="gap-2"
            >
              {user ? 'Submit a Restaurant' : 'Get Started'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold">H</span>
              </div>
              <span className="font-display font-bold text-foreground">HalalBytes</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 HalalBytes. Made with ❤️ for the Muslim community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
