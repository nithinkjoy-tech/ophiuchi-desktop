import { AddProxyDialog } from "@/components/page-components/add-proxy";
import PrepareButtons from "@/components/page-components/certificate-dialogs/cert-buttons";
import { AddProxyToGroupDialog } from "@/components/page-components/proxy-list/add-new/proxy-to-group";
import { DeleteProxyDialog } from "@/components/page-components/proxy-list/delete/delete-proxy-dialog";
import { EditGroupDialog } from "@/components/page-components/proxy-list/edit/group";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Code from "@/components/ui/code";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import proxyListStore from "@/stores/proxy-list";
import { BookmarkMinus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import DockerControl from "../../docker-control";

export default function ProxyListTable() {
  const {
    load,
    proxyList,
    selectedGroup,
    removeProxyFromList,
    removeProxyFromGroup,
    deleteGroup,
  } = proxyListStore();

  const [loaded, setLoaded] = useState(false);

  const prepareConfigPage = useCallback(async () => {
    console.log("prepareConfigPage");
    load();
    setLoaded(true);
  }, [load]);

  useEffect(() => {
    prepareConfigPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function tableCaption() {
    if (selectedGroup?.isNoGroup) {
      return (
        <>
          All of your proxies. <br />
          Add these proxies to the group to start container for this group!
        </>
      );
    }

    if (proxyList.length === 0) {
      return (
        <div className="text-yellow-500 dark:text-yellow-300">
          Add existing proxy in this group to start container for this group!
        </div>
      );
    } else {
      return (
        <>
          List of proxies in this group. <br />
          Press start Container to start the docker webserver.
        </>
      );
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedGroup?.isNoGroup ? (
              "All Proxies"
            ) : (
              <div className="flex gap-2 items-center">
                <div>Proxy Group - {selectedGroup?.name}</div>
                <div className="flex">
                  <EditGroupDialog />
                </div>
              </div>
            )}
          </CardTitle>

          <CardDescription className="flex justify-end">
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <div className="flex gap-2 items-center">
                {selectedGroup?.isNoGroup ? (
                  <AddProxyDialog
                    onDone={() => {
                      //
                    }}
                  />
                ) : (
                  <>
                    <DockerControl />
                    <AddProxyToGroupDialog
                      onDone={() => {
                        //
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption className="text-xs">{tableCaption()}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Hostname</TableHead>
                <TableHead>Application Port</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proxyList.map((proxyItem) => {
                return (
                  <TableRow key={proxyItem.hostname}>
                    <TableCell className="font-medium">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            className="p-2 underline cursor-pointer text-sm sm:pl-0"
                            href={`https://${proxyItem.hostname}`}
                            target="_blank"
                          >
                            {proxyItem.hostname}
                          </a>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>Click to open on browser.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{proxyItem.port}</TableCell>

                    {/* <TableCell></TableCell> */}

                    <TableCell className="flex gap-4 justify-end items-center">
                      {/* <p
                          onClick={() => {
                            openCert(proxyItem);
                          }}
                          className="text-indigo-400 hover:text-indigo-300 cursor-pointer"
                        >
                          Locate Cert
                        </p> */}
                      <PrepareButtons item={proxyItem} />
                      {selectedGroup?.isNoGroup ? (
                        <DeleteProxyDialog
                          proxy={proxyItem}
                          onDelete={() => removeProxyFromList(proxyItem)}
                        />
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size={"sm"}
                              variant={"ghost"}
                              onClick={() => {
                                if (!selectedGroup) return;
                                removeProxyFromGroup(proxyItem, selectedGroup);
                              }}
                            >
                              <BookmarkMinus className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            Remove this proxy from the group:
                            <br />
                            <div className="mt-2">
                              <Code>{selectedGroup?.name}</Code>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedGroup?.isNoGroup ? null : (
        <div className="text-right pt-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant={"ghost"} size="sm">
                <span className="text-muted-foreground">Delete Group</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="">
              <DialogHeader>
                <DialogTitle>Delete Group</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this group?
                </DialogDescription>
              </DialogHeader>
              <Code>{selectedGroup?.name}</Code>
              <DialogFooter>
                <Button
                  variant={"destructive"}
                  onClick={() => {
                    if (selectedGroup) {
                      deleteGroup(selectedGroup?.id);
                    }
                  }}
                >
                  Yes, delete.
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </>
  );
}
