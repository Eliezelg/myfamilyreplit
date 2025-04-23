import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { insertEventSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Étendre le schéma d'événement pour la validation du formulaire
const formSchema = insertEventSchema.extend({
  date: z.date({
    required_error: "נא לבחור תאריך",
  })
});

interface AddEventFormProps {
  familyId: number;
  onClose: () => void;
}

export default function AddEventForm({ familyId, onClose }: AddEventFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Configuration du formulaire avec React Hook Form et Zod
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      familyId,
      title: "",
      description: "",
      date: new Date(),
      type: "manual", // Type par défaut pour les événements manuels
    },
  });
  
  // Mutation pour ajouter un événement
  const addEventMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await apiRequest(
        "POST",
        `/api/families/${familyId}/events`,
        values
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to add event");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Rafraîchir les données d'événements
      queryClient.invalidateQueries({ queryKey: [`/api/families/${familyId}/events`] });
      
      // Afficher un message de confirmation
      toast({
        title: "אירוע נוסף בהצלחה",
        description: "האירוע נוסף ליומן המשפחתי",
        variant: "default",
      });
      
      // Fermer la fenêtre modale
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בהוספת האירוע",
        description: error.message || "אירעה שגיאה בעת הוספת האירוע",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });
  
  // Gestion de la soumission du formulaire
  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    addEventMutation.mutate(values);
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rtl">
        {/* Titre de l'événement */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>כותרת האירוע</FormLabel>
              <FormControl>
                <Input placeholder="למשל: חגיגת יום הולדת" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Description de l'événement */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>תיאור</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="פרטים נוספים על האירוע"
                  rows={3}
                  {...field}
                  value={field.value || ""} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Date de l'événement */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>תאריך</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal flex justify-between items-center",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "dd/MM/yyyy")
                      ) : (
                        <span>בחר תאריך</span>
                      )}
                      <CalendarIcon className="h-4 w-4 opacity-70" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Boutons d'actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            ביטול
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "מוסיף אירוע..." : "הוסף אירוע"}
          </Button>
        </div>
      </form>
    </Form>
  );
}