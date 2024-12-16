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
import { CertificateManager } from "@/helpers/certificate-manager";
import { IProxyData } from "@/helpers/proxy-manager/interfaces";
import { invoke } from "@tauri-apps/api/core";
import { appDataDir } from "@tauri-apps/api/path";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect } from "react";

export default function GenerateCertificateDialog({
  item,
  onDone,
}: {
  item: IProxyData;
  onDone: () => void;
}) {
  const [groupName, setGroupName] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [certExist, setCertExist] = React.useState(false);
  const [certAddedToKeychain, setCertAddedToKeychain] = React.useState(false);
  const [certExistsInKeychain, setCertExistsInKeychain] = React.useState(false);

  async function checkExist(hostname: string) {
    const certMgr = CertificateManager.shared();
    const exists = await certMgr.checkCertificateExists(hostname);
    setCertExist(exists);
    checkExistOnKeychain(hostname);
  }

  async function checkExistOnKeychain(hostname: string) {
    const exist = (await invoke("cert_exist_on_keychain", {
      name: `${item.hostname}`,
    })) as boolean;
    setCertExistsInKeychain(exist);
  }

  function generateCertificate() {
    const certMgr = CertificateManager.shared();
    certMgr.generateCertificate(item.hostname).then((pems) => {
      console.log(pems);
      checkExist(item.hostname);
    });
  }

  const addCertToKeychain = useCallback(async () => {
    if (!item) return;
    try {
      const appDataDirPath = await appDataDir();
      const pemFilePath = `${appDataDirPath}/cert/${item.hostname}/cert.pem`;
      // support for whitespaces in path
      // const whiteSpaced = pemFilePath.replace(/ /g, "\\ ");
      const certExistsInKeychain = await invoke("cert_exist_on_keychain", {
        name: `${item.hostname}`,
      });
      if (certExistsInKeychain) {
        await invoke("remove_cert_from_keychain", {
          name: `${item.hostname}`,
        });
      }

      const result = (await invoke("add_cert_to_keychain", {
        pem_file_path: `${pemFilePath}`,
      })) as boolean;
      setCertAddedToKeychain(true);
    } catch (e) {
      console.error(e);
    }
  }, [item]);

  useEffect(() => {
    checkExist(item.hostname);
  }, [item.hostname]);

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
        <div className="">
          <Button size="sm" onClick={addCertToKeychain}>
            Add to Keychain
          </Button>
          <p className="text-sm text-muted-foreground">or</p>
          <p className="text-sm text-muted-foreground">
            <Link
              className="underline text-foreground"
              href="https://google.com"
            >
              See instructions
            </Link>{" "}
            on how to add and trust the certificate to your keychain manually.
          </p>
        </div>
      );
    }
  }

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
            Generate new certificate for this proxy, and add it to your
            keychain.
          </DialogDescription>
        </DialogHeader>
        <div className="grid space-y-8">
          <div className="grid gap-4">
            <Label>
              1. Generate a new certificate for <strong>{item.hostname}</strong>
            </Label>
            <div className="flex">
              {certExist ? (
                <div className="">
                  <Button size="sm" variant="secondary" disabled={true}>
                    Done
                  </Button>
                  <p
                    className="underline cursor-pointer text-muted-foreground text-sm pt-2"
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
          <div className="grid gap-4">
            <Label>2. Add the certificate to your keychain access.</Label>
            <div className="flex">{certificateActionButton()}</div>
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
