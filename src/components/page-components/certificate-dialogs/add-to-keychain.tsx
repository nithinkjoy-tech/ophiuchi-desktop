"use client";

import { Button } from "@/components/ui/button";
import Code from "@/components/ui/code";
import { CopyCommandButton } from "@/components/ui/copy-command-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CertificateManager } from "@/helpers/certificate-manager";
import { IProxyData } from "@/helpers/proxy-manager/interfaces";
import { useToast } from "@/hooks/use-toast";
import { certKeychainStore } from "@/stores/cert-keychain-store";
import { KeyRound, TriangleAlertIcon } from "lucide-react";
import React, { useCallback, useEffect } from "react";

export default function AddCertificateToKeychainDialog({
  item,
  onDone,
}: {
  item: IProxyData;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [certExist, setCertExist] = React.useState(false);
  const [certAddedToKeychain, setCertAddedToKeychain] = React.useState(false);
  const [manualCommand, setManualCommand] = React.useState("");
  const [certExistsOnKeychain, setCertExistsOnKeychain] = React.useState(false);
  const {
    certOnKeychain,
    checkCertExistOnKeychain,
    addCertToKeychain,
    removeCertFromKeychain,
    generateManualCommand,
  } = certKeychainStore();

  async function checkExist(hostname: string) {
    const certMgr = CertificateManager.shared();
    const exists = await certMgr.checkCertificateExists(hostname);
    setCertExist(exists);
  }

  const onAddCertToKeychain = useCallback(async () => {
    if (!item) return;
    try {
      const exist = await checkCertExistOnKeychain(item.hostname, true);
      if (exist) {
        await removeCertFromKeychain(item.hostname);
      }

      await addCertToKeychain(item.hostname);
      setCertAddedToKeychain(true);
      await checkCertExistOnKeychain(item.hostname, true);
      toast({
        title: "Certificate Added",
        description: "Certificate has been added to keychain successfully",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Certificate Error",
        description: "Failed to add certificate to keychain",
      });
    }
  }, [
    addCertToKeychain,
    checkCertExistOnKeychain,
    item,
    removeCertFromKeychain,
    toast,
  ]);

  useEffect(() => {
    checkExist(item.hostname);
    checkCertExistOnKeychain(item.hostname).then((exists) => {
      setCertExistsOnKeychain(exists);
    });
    setCertAddedToKeychain(false);
    generateManualCommand(item.hostname).then((cmd) => {
      setManualCommand(cmd);
    });
  }, [item.hostname, open]);

  function certificateActionButton() {
    if (!certExist) {
      return (
        <span className="text-muted-foreground text-sm">
          Generate certificate first
        </span>
      );
    }
    if (certExist) {
      if (certAddedToKeychain) {
        return (
          <Button size="sm" variant="secondary" disabled={true}>
            Done
          </Button>
        );
      }
      return (
        <div className="grid gap-2">
          <Button size="sm" onClick={onAddCertToKeychain}>
            {certExistsOnKeychain && "Re-"}Add to Keychain
          </Button>
        </div>
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <DialogTrigger asChild>
          <TooltipTrigger asChild>
            {!certExistsOnKeychain ? (
              <Button variant="default" size="sm" className="">
                <KeyRound className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="text-green-500">
                <KeyRound className="h-4 w-4" />
              </Button>
            )}
          </TooltipTrigger>
        </DialogTrigger>
        <TooltipContent side="top">
          <p>Add certificate to keychain.</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlertIcon className="h-5 w-5 text-primary" />
            Add Certificate to Keychain Access
          </DialogTitle>
          <DialogDescription>
            This dialog will help you add the certificate to your keychain
            access and then trust it, so that your browser can trust the
            certificate.
          </DialogDescription>
        </DialogHeader>
        <div className="w-full">
          <Tabs defaultValue="auto" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="auto">Auto</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>
            <TabsContent value="auto" className="py-4">
              <div className="grid gap-4">
                <Label className="">
                  Click the button to add the certificate to your keychain
                  access and trust.
                </Label>
                {certExistsOnKeychain && (
                  <Label className="text-yellow-500">
                    Note: Certificate already added to keychain access. <br />
                    This will remove and re-add the certificate.
                  </Label>
                )}
                <div className="mt-4">{certificateActionButton()}</div>
              </div>
            </TabsContent>
            <TabsContent value="manual" className="py-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TriangleAlertIcon className="h-5 w-5 text-yellow-500" />
                  <p className="text-muted-foreground">
                    If you prefer to add the certificate manually, you can use the following command:
                  </p>
                </div>
                <div className="space-y-2">
                  <Code className="text-sm whitespace-pre-wrap break-all max-w-full overflow-x-auto p-4">{manualCommand}</Code>
                  <div className="grid gap-2">
                    <CopyCommandButton command={manualCommand} />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            variant={"secondary"}
            onClick={() => {
              setOpen(false);
              onDone();
            }}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
