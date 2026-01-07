"use client";

import { useState, useEffect } from "react";
import { Loader2, Download, Clock, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueueItem } from "@/lib/readarr-queue";
import { toast } from "sonner";

export default function DownloadsPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
    // Refresh every 5 seconds
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await fetch("/api/queue");
      
      if (!response.ok) {
        throw new Error("Failed to fetch queue");
      }

      const data = await response.json();
      setQueue(data.records || []);
    } catch (error) {
      toast.error("Failed to load download queue");
      console.error("Queue fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "downloading":
        return "bg-blue-500";
      case "warning":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getProgress = (item: QueueItem) => {
    if (item.size === 0) return 0;
    return ((item.size - item.sizeleft) / item.size) * 100;
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Downloads</h1>
        <p className="text-muted-foreground">
          Active downloads and queue
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queue.filter(q => q.status === "downloading").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queued</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queue.filter(q => q.status === "queued").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings/Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {queue.filter(q => q.status === "warning" || q.status === "error").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Items */}
      <div className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && queue.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No active downloads</p>
          </div>
        )}

        {!isLoading && queue.length > 0 && (
          <div className="space-y-4">
            {queue.map((item) => {
              const progress = getProgress(item);
              
              return (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{item.title}</h3>
                          {item.book && (
                            <p className="text-sm text-muted-foreground">
                              {item.book.authorTitle || "Unknown Author"}
                            </p>
                          )}
                        </div>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {formatBytes(item.size - item.sizeleft)} / {formatBytes(item.size)}
                          </span>
                          <span className="font-medium">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {item.timeleft && (
                        <p className="text-sm text-muted-foreground">
                          Time left: {item.timeleft}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Protocol: {item.protocol}</span>
                        <span>•</span>
                        <span>Client: {item.downloadClient}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
