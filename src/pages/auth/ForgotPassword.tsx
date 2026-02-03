import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      toast({
        title: "Error sending reset link",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setIsSubmitted(true);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 xl:px-24">
        <div className="max-w-md w-full mx-auto">
          <Link to="/auth/signin" className="inline-block">
            <Button variant="ghost" className="mb-8 -ml-2 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-8">
              <img src="/HB_LOGO.svg" alt="HalalBytes Logo" className="w-10 h-10" />
              <span className="font-display font-bold text-2xl text-foreground">
                HalalBytes
              </span>
            </div>

            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Forgot your password?
            </h1>
            <p className="text-muted-foreground mb-8">
              No worries, we'll send you reset instructions.
            </p>

            {isSubmitted ? (
              <div className="text-center bg-card p-8 rounded-lg">
                <Mail className="h-12 w-12 text-halal-full mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground">
                  Check your email
                </h2>
                <p className="text-muted-foreground mt-2">
                  We have sent a password reset link to{" "}
                  <span className="font-semibold text-foreground">{email}</span>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 btn-glow"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Sending link..."
                    : "Send Password Reset Link"}
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 xl:w-2/5 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center text-primary-foreground">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="font-display text-4xl font-bold mb-4">
                Find Your Next
                <br />
                Halal Meal
              </h2>
              <p className="text-primary-foreground/80 text-lg max-w-sm mx-auto">
                Join thousands of Muslims discovering authentic halal food in
                their neighborhoods.
              </p>
            </motion.div>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white/5" />
      </div>
    </div>
  );
};

export default ForgotPassword;
