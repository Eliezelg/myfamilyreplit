import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, parse } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useDropzone } from "react-dropzone";
import { User, Child } from "@shared/schema";
import { Loader2, Calendar, Plus, PenLine, Trash2, Save, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useLocation } from "wouter";

// Schéma de validation pour le formulaire du profil
const profileSchema = z.object({
  firstName: z.string().min(1, { message: "השם הפרטי הוא שדה חובה" }),
  lastName: z.string().min(1, { message: "שם המשפחה הוא שדה חובה" }),
  fullName: z.string().optional(), // Gardé pour compatibilité
  displayName: z.string().optional(),
  email: z.string().email({ message: "כתובת דוא״ל לא תקינה" }),
  birthDate: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Schéma de validation pour le formulaire de changement de mot de passe
const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: "סיסמה נוכחית היא שדה חובה" }),
  newPassword: z.string().min(6, { message: "סיסמה חדשה חייבת להכיל לפחות 6 תווים" }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "סיסמאות אינן תואמות",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

// Schéma de validation pour le formulaire d'enfant
const childSchema = z.object({
  name: z.string().min(1, { message: "שם הילד/ה הוא שדה חובה" }),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
});

type ChildFormValues = z.infer<typeof childSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAddChildDialogOpen, setIsAddChildDialogOpen] = useState(false);
  const [isEditChildDialogOpen, setIsEditChildDialogOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [childPhotoFile, setChildPhotoFile] = useState<File | null>(null);
  const [childPhotoPreview, setChildPhotoPreview] = useState<string | null>(null);

  // Récupérer les données du profil utilisateur
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const response = await fetch("/api/profile");
      if (!response.ok) throw new Error("Impossible de récupérer les données du profil");
      return response.json();
    },
    enabled: !!user,
  });

  // Récupérer les enfants de l'utilisateur
  const { data: children, isLoading: isLoadingChildren } = useQuery({
    queryKey: ["/api/children"],
    queryFn: async () => {
      const response = await fetch("/api/children");
      if (!response.ok) throw new Error("Impossible de récupérer les enfants");
      return response.json();
    },
    enabled: !!user,
  });

  // Formulaire de profil
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      fullName: user?.fullName || "",
      displayName: user?.displayName || "",
      email: user?.email || "",
      birthDate: user?.birthDate 
        ? format(new Date(user.birthDate), "yyyy-MM-dd")
        : undefined,
    },
  });

  // Mutation pour mettre à jour le profil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      // Assurez-vous que birthDate est correctement formaté ou null
      const formattedData = {
        ...data,
        birthDate: data.birthDate && data.birthDate.trim() !== "" 
          ? new Date(data.birthDate).toISOString() 
          : null,
      };
      
      const response = await apiRequest("PUT", "/api/profile", formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "פרופיל עודכן",
        description: "פרטי הפרופיל שלך עודכנו בהצלחה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בעדכון פרופיל",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation pour télécharger une photo de profil
  const uploadProfilePhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profileImage", file);
      
      const response = await fetch("/api/profile/picture", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("שגיאה בהעלאת תמונת פרופיל");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "תמונת פרופיל עודכנה",
        description: "תמונת הפרופיל שלך עודכנה בהצלחה",
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בהעלאת תמונת פרופיל",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Formulaire de mot de passe
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Mutation pour changer le mot de passe
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const passwordData = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      };
      const response = await apiRequest("POST", "/api/profile/password", passwordData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "סיסמה שונתה",
        description: "הסיסמה שלך שונתה בהצלחה",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בשינוי סיסמה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Formulaire d'ajout d'enfant
  const childForm = useForm<ChildFormValues>({
    resolver: zodResolver(childSchema),
    defaultValues: {
      name: "",
      birthDate: "",
      gender: "",
    },
  });

  // Mutation pour ajouter un enfant
  const addChildMutation = useMutation({
    mutationFn: async (data: ChildFormValues) => {
      const formattedData = {
        ...data,
        birthDate: data.birthDate && data.birthDate.trim() !== "" 
          ? new Date(data.birthDate).toISOString() 
          : null,
      };
      
      const response = await apiRequest("POST", "/api/children", formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "ילד/ה נוסף/ה",
        description: "ילד/ה נוסף/ה בהצלחה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setIsAddChildDialogOpen(false);
      childForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בהוספת ילד/ה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation pour mettre à jour un enfant
  const updateChildMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: ChildFormValues }) => {
      const formattedData = {
        ...data,
        birthDate: data.birthDate && data.birthDate.trim() !== "" 
          ? new Date(data.birthDate).toISOString() 
          : null,
      };
      
      const response = await apiRequest("PUT", `/api/children/${id}`, formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "פרטי הילד/ה עודכנו",
        description: "פרטי הילד/ה עודכנו בהצלחה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setIsEditChildDialogOpen(false);
      setSelectedChild(null);
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בעדכון פרטי הילד/ה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation pour supprimer un enfant
  const deleteChildMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/children/${id}`);
      if (!response.ok) {
        throw new Error("שגיאה במחיקת הילד/ה");
      }
    },
    onSuccess: () => {
      toast({
        title: "ילד/ה נמחק/ה",
        description: "הילד/ה נמחק/ה בהצלחה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setIsEditChildDialogOpen(false);
      setSelectedChild(null);
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה במחיקת הילד/ה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation pour télécharger une photo d'enfant
  const uploadChildPhotoMutation = useMutation({
    mutationFn: async ({ id, file }: { id: number, file: File }) => {
      const formData = new FormData();
      formData.append("profileImage", file);
      
      const response = await fetch(`/api/children/${id}/picture`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("שגיאה בהעלאת תמונת הילד/ה");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "תמונת הילד/ה עודכנה",
        description: "תמונת הילד/ה עודכנה בהצלחה",
      });
      setChildPhotoFile(null);
      setChildPhotoPreview(null);
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בהעלאת תמונת הילד/ה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Dropzone pour la photo de profil
  const { getRootProps: getProfileRootProps, getInputProps: getProfileInputProps } = useDropzone({
    accept: {
      'image/jpeg': [],
      'image/png': []
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setPhotoFile(file);
      
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
  });

  // Dropzone pour la photo d'enfant
  const { getRootProps: getChildRootProps, getInputProps: getChildInputProps } = useDropzone({
    accept: {
      'image/jpeg': [],
      'image/png': []
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setChildPhotoFile(file);
      
      const reader = new FileReader();
      reader.onload = () => {
        setChildPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
  });

  // Soumission du formulaire de profil
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
    
    if (photoFile) {
      uploadProfilePhotoMutation.mutate(photoFile);
    }
  };

  // Soumission du formulaire de mot de passe
  const onPasswordSubmit = (data: PasswordFormValues) => {
    changePasswordMutation.mutate(data);
  };

  // Soumission du formulaire d'ajout d'enfant
  const onAddChildSubmit = (data: ChildFormValues) => {
    addChildMutation.mutate(data);
  };

  // Soumission du formulaire de mise à jour d'enfant
  const onUpdateChildSubmit = (data: ChildFormValues) => {
    if (!selectedChild) return;
    
    updateChildMutation.mutate({ id: selectedChild.id, data });
    
    if (childPhotoFile) {
      uploadChildPhotoMutation.mutate({ id: selectedChild.id, file: childPhotoFile });
    }
  };

  // Fonction pour ouvrir le formulaire d'édition d'enfant
  const openEditChildDialog = (child: Child) => {
    setSelectedChild(child);
    childForm.reset({
      name: child.name,
      birthDate: child.birthDate ? format(new Date(child.birthDate), "yyyy-MM-dd") : "",
      gender: child.gender || "",
    });
    setChildPhotoPreview(child.profileImage || null);
    setIsEditChildDialogOpen(true);
  };

  if (isLoadingProfile || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6 flex items-center">
        <Button 
          variant="outline" 
          size="icon" 
          className="ml-2" 
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold text-right">פרופיל</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">פרופיל</TabsTrigger>
          <TabsTrigger value="password">סיסמה</TabsTrigger>
          <TabsTrigger value="children">ילדים</TabsTrigger>
        </TabsList>
        
        {/* Onglet Profil */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>עריכת פרטי פרופיל</CardTitle>
              <CardDescription>עדכן את פרטי הפרופיל האישיים שלך</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form 
                  onSubmit={profileForm.handleSubmit(onProfileSubmit)} 
                  className="space-y-6"
                >
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative">
                      <div 
                        {...getProfileRootProps()} 
                        className="cursor-pointer relative"
                      >
                        <input {...getProfileInputProps()} />
                        <Avatar className="h-24 w-24 border-2 border-primary">
                          <AvatarImage 
                            src={photoPreview || user.profileImage || ""} 
                            alt={`${user.firstName} ${user.lastName}`}
                          />
                          <AvatarFallback>{user.firstName?.charAt(0) || ''}{user.lastName?.charAt(0) || ''}</AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1">
                          <PenLine className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>שם פרטי</FormLabel>
                          <FormControl>
                            <Input dir="rtl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>שם משפחה</FormLabel>
                          <FormControl>
                            <Input dir="rtl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>שם תצוגה</FormLabel>
                        <FormControl>
                          <Input dir="rtl" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>
                          השם שיוצג לבני המשפחה האחרים
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>דוא"ל</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>תאריך לידה</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="date" {...field} value={field.value || ""} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending || uploadProfilePhotoMutation.isPending}
                    >
                      {(updateProfileMutation.isPending || uploadProfilePhotoMutation.isPending) && (
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      )}
                      שמור שינויים
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Onglet Mot de passe */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>שינוי סיסמה</CardTitle>
              <CardDescription>שנה את הסיסמה שלך</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form 
                  onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} 
                  className="space-y-6"
                >
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>סיסמה נוכחית</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>סיסמה חדשה</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>אימות סיסמה חדשה</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending && (
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      )}
                      שנה סיסמה
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Onglet Enfants */}
        <TabsContent value="children">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>הילדים שלי</CardTitle>
                <CardDescription>נהל את פרטי הילדים שלך</CardDescription>
              </div>
              <Button onClick={() => {
                childForm.reset({
                  name: "",
                  birthDate: "",
                  gender: "",
                });
                setChildPhotoFile(null);
                setChildPhotoPreview(null);
                setIsAddChildDialogOpen(true);
              }}>
                <Plus className="ml-2 h-4 w-4" />
                הוסף ילד/ה
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingChildren ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : children && children.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {children.map((child: Child) => (
                    <Card key={child.id} className="overflow-hidden">
                      <div className="aspect-square relative overflow-hidden">
                        {child.profileImage ? (
                          <img 
                            src={child.profileImage} 
                            alt={child.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <Avatar className="h-20 w-20">
                              <AvatarFallback>{child.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                      </div>
                      <CardFooter className="flex flex-col items-start p-4">
                        <div className="flex justify-between w-full">
                          <h3 className="font-semibold text-lg">{child.name}</h3>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditChildDialog(child)}
                          >
                            <PenLine className="h-4 w-4" />
                          </Button>
                        </div>
                        {child.birthDate && (
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(child.birthDate), "dd/MM/yyyy")}
                          </p>
                        )}
                        {child.gender && (
                          <p className="text-sm text-muted-foreground">
                            {child.gender === "male" ? "זכר" : "נקבה"}
                          </p>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">אין לך עדיין ילדים ברשימה</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddChildDialogOpen(true)}
                    className="mt-2"
                  >
                    <Plus className="ml-2 h-4 w-4" />
                    הוסף ילד/ה
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogue d'ajout d'enfant */}
      <Dialog open={isAddChildDialogOpen} onOpenChange={setIsAddChildDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>הוספת ילד/ה</DialogTitle>
            <DialogDescription>
              הוסף את פרטי הילד/ה שלך
            </DialogDescription>
          </DialogHeader>
          <Form {...childForm}>
            <form 
              onSubmit={childForm.handleSubmit(onAddChildSubmit)} 
              className="space-y-4"
            >
              <div className="flex items-center justify-center mb-6">
                <div
                  {...getChildRootProps()}
                  className="cursor-pointer"
                >
                  <input {...getChildInputProps()} />
                  <div className="h-24 w-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {childPhotoPreview ? (
                      <img 
                        src={childPhotoPreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Plus className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs text-center mt-2 text-muted-foreground">לחץ להוספת תמונה</p>
                </div>
              </div>

              <FormField
                control={childForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם</FormLabel>
                    <FormControl>
                      <Input dir="rtl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={childForm.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תאריך לידה</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="date" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={childForm.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מגדר</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">בחר מגדר</option>
                        <option value="male">זכר</option>
                        <option value="female">נקבה</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddChildDialogOpen(false)}
                >
                  ביטול
                </Button>
                <Button 
                  type="submit" 
                  disabled={addChildMutation.isPending}
                >
                  {addChildMutation.isPending && (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  )}
                  הוסף
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialogue d'édition d'enfant */}
      <Dialog open={isEditChildDialogOpen} onOpenChange={setIsEditChildDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>עריכת פרטי ילד/ה</DialogTitle>
            <DialogDescription>
              ערוך את פרטי הילד/ה שלך
            </DialogDescription>
          </DialogHeader>
          <Form {...childForm}>
            <form 
              onSubmit={childForm.handleSubmit(onUpdateChildSubmit)} 
              className="space-y-4"
            >
              <div className="flex items-center justify-center mb-6">
                <div
                  {...getChildRootProps()}
                  className="cursor-pointer"
                >
                  <input {...getChildInputProps()} />
                  <div className="h-24 w-24 rounded-full border-2 border-gray-300 flex items-center justify-center overflow-hidden">
                    {childPhotoPreview ? (
                      <img 
                        src={childPhotoPreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Plus className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs text-center mt-2 text-muted-foreground">לחץ לשינוי תמונה</p>
                </div>
              </div>

              <FormField
                control={childForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם</FormLabel>
                    <FormControl>
                      <Input dir="rtl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={childForm.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תאריך לידה</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="date" {...field} value={field.value || ""} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={childForm.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מגדר</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                        value={field.value || ""}
                      >
                        <option value="">בחר מגדר</option>
                        <option value="male">זכר</option>
                        <option value="female">נקבה</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-4 flex-col sm:flex-row">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    if (selectedChild) {
                      deleteChildMutation.mutate(selectedChild.id);
                    }
                  }}
                  disabled={deleteChildMutation.isPending}
                >
                  {deleteChildMutation.isPending && (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  )}
                  <Trash2 className="ml-2 h-4 w-4" />
                  מחק
                </Button>
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditChildDialogOpen(false)}
                  >
                    ביטול
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateChildMutation.isPending || uploadChildPhotoMutation.isPending}
                  >
                    {(updateChildMutation.isPending || uploadChildPhotoMutation.isPending) && (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="ml-2 h-4 w-4" />
                    שמור
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}