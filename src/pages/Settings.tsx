import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Shield, Database } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DataBackupDialog } from "@/components/settings/DataBackupDialog";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>({
    first_name: "",
    last_name: "",
    email: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || user.email || "",
        });
      } else {
        setProfile({
          first_name: "",
          last_name: "",
          email: user.email || "",
        });
      }
      setLoading(false);
    }

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Fel",
        description: "Kunde inte spara profilen",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sparat",
        description: "Din profil har uppdaterats",
      });
    }
    setSaving(false);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6">
          <Header />
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Inställningar</h1>
            <p className="text-muted-foreground">Hantera ditt konto och data</p>
          </div>

          <div className="max-w-2xl space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profilinställningar
                </CardTitle>
                <CardDescription>
                  Uppdatera din personliga information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <p className="text-muted-foreground">Laddar...</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Förnamn</Label>
                        <Input
                          id="firstName"
                          value={profile.first_name || ""}
                          onChange={(e) =>
                            setProfile({ ...profile, first_name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Efternamn</Label>
                        <Input
                          id="lastName"
                          value={profile.last_name || ""}
                          onChange={(e) =>
                            setProfile({ ...profile, last_name: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        E-post
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email || ""}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        E-postadressen kan inte ändras
                      </p>
                    </div>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "Sparar..." : "Spara ändringar"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Datahantering
                </CardTitle>
                <CardDescription>
                  Exportera och importera din data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Skapa en säkerhetskopia av all din data eller återställ från en tidigare backup.
                </p>
                <DataBackupDialog />
              </CardContent>
            </Card>

            {/* Security Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Säkerhet
                </CardTitle>
                <CardDescription>
                  Hantera dina säkerhetsinställningar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Fler säkerhetsfunktioner kommer snart, som lösenordsbyte och tvåfaktorsautentisering.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
