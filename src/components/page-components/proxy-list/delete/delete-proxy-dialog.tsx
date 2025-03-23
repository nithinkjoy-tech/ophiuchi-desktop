import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Code from "@/components/ui/code";
import { CopyCommandButton } from "@/components/ui/copy-command-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CertificateManager } from "@/helpers/certificate-manager";
import { IProxyData } from "@/helpers/proxy-manager/interfaces";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Certificate } from "@/stores/cert-keychain-store";
import { certKeychainStore } from "@/stores/cert-keychain-store";
import { invoke } from "@tauri-apps/api/core";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  ShieldAlert,
  Trash,
  TriangleAlertIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

interface DeleteProxyDialogProps {
  proxy: IProxyData;
  onDelete: () => void;
}

interface HostsFileContext {
  lineNumber: number;
  surroundingLines: string[];
}

interface StepStatus {
  completed: boolean;
  loading: boolean;
  error?: string;
}

const STEP_DELAY = 3000; // 3 seconds delay between steps

export function DeleteProxyDialog({ proxy, onDelete }: DeleteProxyDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [hostsContext, setHostsContext] = useState<HostsFileContext | null>(
    null
  );
  const [password, setPassword] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [stepStatuses, setStepStatuses] = useState<Record<number, StepStatus>>({
    1: { completed: false, loading: false },
    2: { completed: false, loading: false },
    3: { completed: false, loading: false },
  });

  const certManager = CertificateManager.shared();
  const [foundCertificates, setFoundCertificates] = useState<Certificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certificate | null>(null);
  const { findCertificates, removeCertBySha1 } = certKeychainStore.getState();

  const steps = [
    {
      step: 1,
      title: "Remove from /etc/hosts",
      description: "Delete hostname entry from hosts file",
      requiresPassword: true,
    },
    {
      step: 2,
      title: "Remove from Keychain",
      description: "Remove SSL certificate from Keychain",
      requiresPassword: false,
    },
    {
      step: 3,
      title: "Delete Certificate Files",
      description: "Clean up certificate files",
      requiresPassword: false,
    },
  ];

  const checkInitialStatus = async () => {
    try {
      // Check hosts file
      const hostsExists = await invoke("check_host_exists", {
        hostname: proxy.hostname,
      });
      setStepStatuses((prev) => ({
        ...prev,
        1: { ...prev[1], completed: !hostsExists },
      }));

      // Find certificates
      const certificates = (await findCertificates(proxy.hostname)).filter(
        (cert) => cert.name === proxy.hostname
      );
      setFoundCertificates(certificates);

      // Check if exact match exists
      const exactMatch = certificates.find(
        (cert) => cert.name === proxy.hostname
      );
      setSelectedCertificate(exactMatch || null);

      setStepStatuses((prev) => ({
        ...prev,
        2: { ...prev[2], completed: !exactMatch },
      }));

      // Check certificate files
      const certFilesExist = await certManager.checkCertificateExists(
        proxy.hostname
      );
      setStepStatuses((prev) => ({
        ...prev,
        3: { ...prev[3], completed: !certFilesExist },
      }));
    } catch (e) {
      console.error("Failed to check initial status:", e);
    }
  };

  useEffect(() => {
    if (open) {
      checkInitialStatus();
    }
  }, [open]);

  const updateStepStatus = (step: number, status: Partial<StepStatus>) => {
    setStepStatuses((prev) => ({
      ...prev,
      [step]: { ...prev[step], ...status },
    }));
  };

  const handleStepExecution = async (step: number) => {
    updateStepStatus(step, { loading: true });

    try {
      switch (step) {
        case 1:
          await invoke("delete_line_from_hosts", {
            hostname: proxy.hostname,
            password,
          });
          break;
        case 2:
          if (!selectedCertificate) {
            throw new Error("No certificate selected for deletion");
          }
          await removeCertBySha1(selectedCertificate.sha1);
          break;
        case 3:
          await certManager.deleteCertificateFiles(proxy.hostname);
          break;
      }

      updateStepStatus(step, { completed: true, loading: false });
      return true;
    } catch (e) {
      console.error(`Failed at step ${step}:`, e);
      const error = e instanceof Error ? e.message : "Unknown error";
      updateStepStatus(step, {
        loading: false,
        error: `Failed to complete step ${step}: ${error}`,
      });
      return false;
    }
  };

  const handleAutoDelete = async () => {
    if (!password && steps[0].requiresPassword) {
      toast({
        title: "Password Required",
        description:
          "Please enter your system password to proceed with deletion.",
        variant: "destructive",
      });
      return;
    }

    for (const { step } of steps) {
      if (stepStatuses[step].completed) {
        continue; // Skip already completed steps
      }

      setCurrentStep(step);
      const success = await handleStepExecution(step);

      if (!success) {
        toast({
          title: "Deletion Failed",
          description: `Failed at step ${step}. Please check the error message and try again.`,
          variant: "destructive",
        });
        return;
      }

      if (step < steps.length) {
        await new Promise((resolve) => setTimeout(resolve, STEP_DELAY));
      }
    }

    toast({
      title: "Proxy Deleted",
      description: "All steps completed successfully.",
    });
    setOpen(false);
    onDelete();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Trash className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlertIcon className="h-5 w-5 text-destructive" />
            Delete Proxy - {proxy.nickname}
          </DialogTitle>
          <DialogDescription>
            You can delete this proxy automatically or manually
          </DialogDescription>
        </DialogHeader>

        <div className="w-full">
          <Tabs defaultValue="auto" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="auto">Automatic</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>

            <TabsContent value="auto" className="py-4">
              <div className="space-y-6">
                <Stepper
                  value={currentStep}
                  orientation="vertical"
                  className="min-h-[400px]"
                >
                  {steps.map(
                    ({ step, title, description, requiresPassword }) => (
                      <StepperItem
                        key={step}
                        step={step}
                        className={cn(
                          "relative items-start not-last:flex-1",
                          stepStatuses[step].error && "border-destructive"
                        )}
                      >
                        <StepperTrigger className="items-start rounded pb-12 last:pb-0">
                          <div className="relative">
                            <StepperIndicator
                              className={cn(
                                stepStatuses[step].completed &&
                                  "bg-green-500 text-white",
                                stepStatuses[step].error && "bg-destructive"
                              )}
                            />
                          </div>
                          <div className="mt-0.5 space-y-2 px-2 text-left">
                            <StepperTitle className="flex items-center gap-2">
                              <span
                                className={cn(
                                  stepStatuses[step].completed
                                    ? "line-through text-muted-foreground"
                                    : ""
                                )}
                              >
                                {title}
                              </span>
                              {stepStatuses[step].completed && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                              {stepStatuses[step].loading && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              )}
                              {stepStatuses[step].error && (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              )}
                            </StepperTitle>
                            <StepperDescription>
                              {description}
                              {requiresPassword && (
                                <span className="ml-2 text-yellow-500">
                                  (Requires password)
                                </span>
                              )}
                            </StepperDescription>

                            {step === 1 && requiresPassword && (
                              <div className="mt-4 space-y-4">
                                <div className="flex items-center gap-2">
                                  <ShieldAlert className="h-4 w-4 text-yellow-500" />
                                  <p className="text-sm text-muted-foreground">
                                    System password is required for this step
                                  </p>
                                </div>
                                <div className="grid gap-2">
                                  <Label
                                    htmlFor="password"
                                    className="flex items-center gap-2"
                                  >
                                    <KeyRound className="h-4 w-4" />
                                    System Password
                                  </Label>
                                  <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                      setPassword(e.target.value)
                                    }
                                    placeholder="Enter your system password"
                                  />
                                </div>
                              </div>
                            )}

                            {step === 2 && foundCertificates.length > 0 && (
                              <div className="mt-4 space-y-4">
                                <Card className="p-4">
                                  <h4 className="text-sm font-medium mb-2">
                                    Found Certificates:
                                  </h4>
                                  <div className="space-y-2">
                                    {foundCertificates.map((cert, index) => (
                                      <div
                                        key={cert.sha1}
                                        className={cn(
                                          "p-2 rounded text-sm",
                                          cert.name === proxy.hostname &&
                                            "bg-muted",
                                          selectedCertificate?.sha1 ===
                                            cert.sha1 && "border border-primary"
                                        )}
                                      >
                                        <div className="font-medium">
                                          {cert.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          SHA-1: {cert.sha1}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </Card>
                              </div>
                            )}

                            {stepStatuses[step].error && (
                              <div className="mt-2 text-sm text-destructive">
                                {stepStatuses[step].error}
                              </div>
                            )}
                          </div>
                        </StepperTrigger>
                        {step < steps.length && (
                          <StepperSeparator className="absolute inset-y-0 top-[calc(1.5rem+0.125rem)] left-3 -order-1 m-0 -translate-x-1/2 group-data-[orientation=vertical]/stepper:h-[calc(100%-1.5rem-0.25rem)]" />
                        )}
                      </StepperItem>
                    )
                  )}
                </Stepper>

                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleAutoDelete}
                    disabled={
                      stepStatuses[currentStep].loading ||
                      (steps[0].requiresPassword && !password) ||
                      (currentStep === 2 && !selectedCertificate)
                    }
                    className="min-w-[200px]"
                  >
                    {stepStatuses[currentStep].loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      "Start Automatic Deletion"
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="py-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TriangleAlertIcon className="h-5 w-5 text-yellow-500" />
                  <p className="text-base text-muted-foreground">
                    Follow these steps carefully. System password will be
                    required for some operations.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-base flex items-center gap-2">
                      <span>1. Modify /etc/hosts file</span>
                      <ShieldAlert className="h-4 w-4 text-yellow-500" />
                    </h3>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Implement manual hosts file modification
                        }}
                        className="w-full"
                      >
                        Load hosts file context
                      </Button>
                      {hostsContext && (
                        <div className="mt-2 space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Line number: {hostsContext.lineNumber}
                          </p>
                          <Code className="text-sm whitespace-pre-wrap break-all max-w-full overflow-x-auto p-4">
                            {hostsContext.surroundingLines.join("\n")}
                          </Code>
                        </div>
                      )}
                      <div className="pt-2">
                        <Code className="text-sm whitespace-pre-wrap break-all max-w-full overflow-x-auto p-4">
                          sudo sed -i &apos;&apos; &apos;/${proxy.hostname}
                          /d&apos; /etc/hosts
                        </Code>
                        <div className="pt-2">
                          <CopyCommandButton
                            command={`sudo sed -i '' '/${proxy.hostname}/d' /etc/hosts`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-base flex items-center gap-2">
                      <span>2. Remove certificate from keychain</span>
                    </h3>
                    <div className="space-y-2">
                      {foundCertificates.length > 0 ? (
                        <div className="space-y-4">
                          {foundCertificates.map((cert) => (
                            <div key={cert.sha1} className="space-y-2">
                              <Code className="text-sm whitespace-pre-wrap break-all max-w-full overflow-x-auto p-4">
                                security delete-certificate -Z &quot;{cert.sha1}
                                &quot;
                              </Code>
                              <CopyCommandButton
                                command={`security delete-certificate -Z "${cert.sha1}"`}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No certificates found for {proxy.hostname}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-base">
                      3. Delete certificate files
                    </h3>
                    <div className="space-y-2">
                      <Code className="text-sm whitespace-pre-wrap break-all max-w-full overflow-x-auto p-4">
                        rm -rf ~/.ophiuchi/cert/{proxy.hostname}
                      </Code>
                      <CopyCommandButton
                        command={`rm -rf ~/.ophiuchi/cert/${proxy.hostname}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
