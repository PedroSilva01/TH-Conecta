import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Upload } from "lucide-react";

export default function StudentVerificationPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [institution, setInstitution] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Get verification status
  type VerificationStatusType = {
    verified: boolean;
    expiryDate?: string;
    message?: string;
  };
  
  const { data: verificationStatus, isLoading } = useQuery<VerificationStatusType>({
    queryKey: ["/api/user/student-verification"],
    enabled: !!user,
  });
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  
  // Submit verification
  const submitVerificationMutation = useMutation({
    mutationFn: async (data: { documentBase64: string; documentType: string; institution: string }) => {
      const res = await apiRequest("POST", "/api/user/student-verification", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/student-verification"] });
      
      toast({
        title: "Declaração enviada com sucesso!",
        description: "Sua declaração de estudante foi recebida e está sendo verificada."
      });
      
      navigate("/profile");
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar declaração",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !institution) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione um arquivo e informe a instituição de ensino.",
        variant: "destructive"
      });
      return;
    }
    
    // Convert file to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Content = base64String.split(',')[1];
      
      submitVerificationMutation.mutate({
        documentBase64: base64Content,
        documentType: "student_declaration",
        institution
      });
    };
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col pb-16">
        <PageHeader title="Verificação de Estudante" onBack={() => navigate("/profile")} />
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="animate-pulse">Carregando...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col pb-16">
      <PageHeader title="Verificação de Estudante" onBack={() => navigate("/profile")} />
      
      <div className="flex-1 p-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Declaração de Estudante</CardTitle>
            <CardDescription>
              Envie um documento que comprove que você é estudante para receber o desconto de 50% em passagens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verificationStatus && verificationStatus.verified ? (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <AlertTitle>Verificação ativa!</AlertTitle>
                <AlertDescription>
                  Sua declaração de estudante está verificada e válida até{" "}
                  {verificationStatus.expiryDate && format(new Date(verificationStatus.expiryDate), "dd/MM/yyyy")}.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="mb-4 bg-amber-50 border-amber-200">
                <AlertTitle>Verificação necessária</AlertTitle>
                <AlertDescription>
                  {verificationStatus?.message || "Você ainda não possui uma declaração de estudante verificada."}
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institution">Instituição de Ensino</Label>
                <Input
                  id="institution"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Ex: Universidade Federal de São Paulo"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="declaration">Declaração de Matrícula</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  <input
                    type="file"
                    id="declaration"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {previewUrl ? (
                    <div className="space-y-2">
                      <img 
                        src={previewUrl} 
                        alt="Preview da declaração" 
                        className="max-h-40 mx-auto object-contain"
                      />
                      <p className="text-sm text-gray-500">{file?.name}</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setFile(null);
                          setPreviewUrl(null);
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="declaration" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <Upload className="h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-sm font-medium">Arraste ou clique para selecionar seu arquivo</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG ou PNG até 5MB</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate("/profile")}>
              Voltar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={submitVerificationMutation.isPending || !file || !institution}
            >
              {submitVerificationMutation.isPending ? "Enviando..." : "Enviar Declaração"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• A declaração de estudante deve ser renovada anualmente.</p>
            <p>• O documento deve conter seu nome completo, nome da instituição e data de validade.</p>
            <p>• Aceitamos carteirinha de estudante, declaração de matrícula ou boleto pago de mensalidade.</p>
            <p>• Após o envio, a verificação leva até 24 horas para ser processada.</p>
            <p>• Com a verificação ativa, você receberá automaticamente 50% de desconto em todas as passagens.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}