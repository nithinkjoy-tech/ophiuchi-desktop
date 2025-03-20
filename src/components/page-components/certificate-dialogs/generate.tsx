import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { CertificateManager } from "@/helpers/certificate-manager";
import { IProxyData } from "@/helpers/proxy-manager/interfaces";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/lib/constants";
import { invoke } from "@tauri-apps/api/core";
import { appDataDir } from "@tauri-apps/api/path";
import { CheckIcon, PlusIcon } from "lucide-react";
import React, { useEffect } from "react";

export default function GenerateCertificateDialog({
  item,
  onDone,
}: {
  item: IProxyData;
  onDone: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [certExist, setCertExist] = React.useState(false);

  async function checkExist(hostname: string) {
    const certMgr = CertificateManager.shared();
    const exists = await certMgr.checkCertificateExists(hostname);
    setCertExist(exists);
  }

  function generateCertificate() {
    const certMgr = CertificateManager.shared();
    certMgr.generateCertificate(item.hostname).then((pems) => {
      console.log(pems);
      checkExist(item.hostname);
    });
  }

  useEffect(() => {
    checkExist(item.hostname);
  }, [item.hostname]);

  return (
    <Dialog
      open={open}
      onOpenChange={(open: boolean) => {
        setOpen(open);
        onDone();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="">
          <PlusIcon className="h-4 w-4" />
          Generate Certificate...
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Certificate</DialogTitle>
          <DialogDescription>
            Generate new certificate to use this proxy.
          </DialogDescription>
        </DialogHeader>
        <div className="grid space-y-8">
          <div className="grid gap-4">
            <Label>
              Clicking the Generate Certificate will create a new self-signed
              certificate for <strong>{item.hostname}</strong>.
            </Label>
            <div className="flex">
              {certExist ? (
                <div className="">
                  <div className="flex items-center gap-4">
                    <Button size="sm" variant="secondary" disabled={true}>
                      Done
                    </Button>
                    <p
                      className="underline cursor-pointer text-muted-foreground text-sm"
                      onClick={async () => {
                        const appDataDirPath = await appDataDir();
                        invoke("open_finder_or_explorer", {
                          path: `${appDataDirPath}/cert/${item.hostname}`,
                        });
                      }}
                    >
                      Locate on Finder...
                    </p>
                  </div>
                  <Separator className="mt-4" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Tip: You can locate them later by pressing the
                    <Button variant={"outline"} size={"sm"} className="mx-2">
                      <CheckIcon
                        className="text-green-500"
                        size={ICON_SIZE}
                        strokeWidth={ICON_STROKE_WIDTH}
                      />
                    </Button>
                    button at the proxy list.
                  </p>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    generateCertificate();
                  }}
                >
                  Generate Certificate
                </Button>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={() => {
              setOpen(false);
              onDone();
            }}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
