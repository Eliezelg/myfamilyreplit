import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "שם משתמש נדרש"),
  password: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
});

// Ajouter firstName et lastName au schéma
const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "שם פרטי נדרש"),
  lastName: z.string().min(1, "שם משפחה נדרש"),
}).refine(data => data.password === data.confirmPassword, {
  message: "הסיסמאות אינן תואמות",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    // Retirer confirmPassword et combiner firstName et lastName pour fullName
    const { confirmPassword, firstName, lastName, ...restData } = data;
    
    // Créer le nom complet à partir du prénom et du nom
    const fullName = `${firstName} ${lastName}`.trim();
    
    // Envoyer les données avec le nom complet
    registerMutation.mutate({
      ...restData,
      fullName: fullName,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary-50 to-blue-50">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 rounded-xl overflow-hidden shadow-xl">
        <div className="bg-white p-6 md:p-8">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                מ
              </div>
              <h1 className="text-2xl font-bold text-primary">MyFamily</h1>
            </div>
          </div>

          <Tabs 
            defaultValue="login" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="login">התחברות</TabsTrigger>
              <TabsTrigger value="register">הרשמה</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-0 shadow-none">
                <CardHeader className="px-0">
                  <CardTitle className="text-xl text-center">ברוכים הבאים בחזרה</CardTitle>
                  <CardDescription className="text-center">התחבר כדי להמשיך למשפחה שלך</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>שם משתמש</FormLabel>
                            <FormControl>
                              <Input placeholder="הזן שם משתמש" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>סיסמה</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="הזן סיסמה" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        ) : "התחבר"}
                      </Button>
                      <div className="text-right mt-2">
                        <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-gray-700">
                          שכחת סיסמה?
                        </Link>
                      </div>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="px-0 justify-center">
                  <p className="text-sm text-gray-500">
                    אין לך חשבון עדיין?{" "}
                    <Button 
                      variant="link" 
                      onClick={() => setActiveTab("register")}
                      className="p-0"
                    >
                      הירשם עכשיו
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-0 shadow-none">
                <CardHeader className="px-0">
                  <CardTitle className="text-xl text-center">צור חשבון חדש</CardTitle>
                  <CardDescription className="text-center">הירשם כדי להתחיל לחבר את המשפחה שלך</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>שם פרטי</FormLabel>
                              <FormControl>
                                <Input placeholder="הזן שם פרטי" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>שם משפחה</FormLabel>
                              <FormControl>
                                <Input placeholder="הזן שם משפחה" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>אימייל</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="example@mail.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>שם משתמש</FormLabel>
                            <FormControl>
                              <Input placeholder="בחר שם משתמש" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>סיסמה</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="בחר סיסמה" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>אימות סיסמה</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="הזן שוב את הסיסמה" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        ) : "הירשם"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="px-0 justify-center">
                  <p className="text-sm text-gray-500">
                    כבר יש לך חשבון?{" "}
                    <Button 
                      variant="link" 
                      onClick={() => setActiveTab("login")}
                      className="p-0"
                    >
                      התחבר עכשיו
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden md:block relative bg-primary">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
            <h2 className="text-3xl font-bold mb-4 text-center">שומרים על קשר משפחתי חזק</h2>
            <p className="text-center mb-6">
              צרו, שתפו וקבלו גזטה משפחתית מודפסת מדי חודש. הדרך המושלמת לשמור על קשר בין כל הדורות במשפחה.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                העלאת תמונות קלה ומהירה
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                שליחה אוטומטית לסבא וסבתא
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                ניהול קופה משפחתית משותפת
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
