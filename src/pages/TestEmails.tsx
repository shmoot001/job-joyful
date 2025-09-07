import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Mail, Calendar, Clock } from "lucide-react";

export default function TestEmails() {
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);

  const sendTestEmail = async (type: 'daily' | 'weekly') => {
    const setLoading = type === 'daily' ? setIsLoadingDaily : setIsLoadingWeekly;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-summary-email', {
        body: { type, only_user: true }
      });

      if (error) throw error;

      toast({
        title: "Email skickat!",
        description: `${type === 'daily' ? 'Daglig' : 'Vecko'}sammanfattning har skickats`,
      });
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skicka email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">Testa Email-sammanfattningar</h1>
        <p className="text-muted-foreground">Skicka test-emails för att se hur sammanfattningarna ser ut</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>Daglig sammanfattning</CardTitle>
            <CardDescription>
              Visar imorgons pass och uppgifter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Alla pass för nästa dag</p>
              <p>• Uppgifter som förfaller imorgon</p>
              <p>• Beräknade intäkter</p>
            </div>
            <Button 
              onClick={() => sendTestEmail('daily')}
              disabled={isLoadingDaily}
              className="w-full"
            >
              {isLoadingDaily ? (
                "Skickar..."
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Skicka daglig sammanfattning
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>Veckosammanfattning</CardTitle>
            <CardDescription>
              Visar hela veckans aktiviteter och statistik
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Alla pass för aktuell vecka</p>
              <p>• Totala arbetstimmar</p>
              <p>• Totala intäkter</p>
              <p>• Uppgiftsstatistik</p>
            </div>
            <Button 
              onClick={() => sendTestEmail('weekly')}
              disabled={isLoadingWeekly}
              className="w-full"
            >
              {isLoadingWeekly ? (
                "Skickar..."
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Skicka veckosammanfattning
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Automatiska scheman</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium">Daglig sammanfattning</p>
                <p className="text-sm text-muted-foreground">Skickas varje dag kl 07:00</p>
              </div>
              <div className="text-blue-600 font-mono text-sm">07:00</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium">Veckosammanfattning</p>
                <p className="text-sm text-muted-foreground">Skickas varje söndag kl 08:00</p>
              </div>
              <div className="text-green-600 font-mono text-sm">SÖN 08:00</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}