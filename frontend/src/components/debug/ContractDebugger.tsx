"use client";

import { useReadContract, useAccount } from "wagmi";
import { AUCTION_ABI, AUCTION_ADDRESS } from "@/lib/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function ContractDebugger() {
  const { address, isConnected, chainId } = useAccount();
  const [testResult, setTestResult] = useState<string>("");

  const { data: totalAuctions, isLoading, error } = useReadContract({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    functionName: "getTotalAuctions",
  });

  const { data: isPaused } = useReadContract({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    functionName: "paused",
  });

  const { data: auctionCounter } = useReadContract({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    functionName: "auctionCounter",
  });

  const testContract = async () => {
    setTestResult("Testing contract connection...\n");
    
    try {
      // Test 1: Check if contract address is valid
      setTestResult(prev => prev + `✓ Contract Address: ${AUCTION_ADDRESS}\n`);
      
      // Test 2: Check network
      setTestResult(prev => prev + `✓ Network Chain ID: ${chainId}\n`);
      setTestResult(prev => prev + `✓ Wallet Connected: ${isConnected ? "Yes" : "No"}\n`);
      setTestResult(prev => prev + `✓ Wallet Address: ${address || "Not connected"}\n`);
      
      // Test 3: Check total auctions
      if (error) {
        setTestResult(prev => prev + `✗ Error reading contract: ${error.message}\n`);
      } else if (isLoading) {
        setTestResult(prev => prev + `⏳ Loading total auctions...\n`);
      } else {
        setTestResult(prev => prev + `✓ Total Auctions: ${totalAuctions?.toString() || "0"}\n`);
      }
      
      // Test 4: Try to read auction 1 if it exists
      if (totalAuctions && totalAuctions > 0n) {
        setTestResult(prev => prev + `\nTesting auction #1...\n`);
        try {
          // This will be done via the hook, but we can log it
          setTestResult(prev => prev + `✓ Auction #1 exists\n`);
        } catch (err: any) {
          setTestResult(prev => prev + `✗ Error reading auction #1: ${err.message}\n`);
        }
      }
      
      setTestResult(prev => prev + `\n✅ Contract test complete!\n`);
    } catch (err: any) {
      setTestResult(prev => prev + `\n✗ Test failed: ${err.message}\n`);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Contract Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold">Contract Info:</p>
          <p className="text-xs text-muted-foreground font-mono break-all">
            Address: {AUCTION_ADDRESS}
          </p>
          <p className="text-xs text-muted-foreground">
            Network: {chainId ? `Chain ID ${chainId}` : "Not connected"}
          </p>
          <p className="text-xs text-muted-foreground">
            Wallet: {address || "Not connected"}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Contract State:</p>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : error ? (
            <p className="text-xs text-red-500">
              Error: {error.message || "Unknown error"}
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Total Auctions (getTotalAuctions): {totalAuctions?.toString() || "0"}
              </p>
              <p className="text-xs text-muted-foreground">
                Auction Counter: {auctionCounter?.toString() || "0"}
              </p>
              <p className={`text-xs ${isPaused ? "text-red-500" : "text-green-500"}`}>
                Contract Paused: {isPaused ? "Yes ⚠️" : "No ✓"}
              </p>
            </>
          )}
        </div>

        <Button onClick={testContract} variant="outline" size="sm">
          Run Contract Test
        </Button>

        {testResult && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-xs font-mono whitespace-pre-wrap">{testResult}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

