// Ambient module declaration for @creit.tech/stellar-wallets-kit v2.
// Required because v2's package.json is missing a `"types"` field.

declare module "@creit.tech/stellar-wallets-kit" {
  export enum Networks {
    PUBLIC = "Public Global Stellar Network ; September 2015",
    TESTNET = "Test SDF Network ; September 2015",
    FUTURENET = "Test SDF Future Network ; October 2022",
  }

  export interface ISupportedWallet {
    id: string;
    name: string;
    type?: string;
    icon: string;
    isAvailable: boolean;
    url?: string;
  }

  export interface OpenModalOptions {
    onWalletSelected?: (option: ISupportedWallet) => void | Promise<void>;
    onClosed?: (err?: Error) => void;
    modalTitle?: string;
    notAvailableText?: string;
    [key: string]: unknown;
  }

  export interface StellarWalletsKitOptions {
    network: Networks;
    selectedWalletId?: string;
    [key: string]: unknown;
  }

  export class StellarWalletsKit {
    constructor(options: StellarWalletsKitOptions);
    openModal(options?: OpenModalOptions): void;
    closeModal(): void;
    setWallet(walletId: string): void;
    getSupportedWallets(): Promise<ISupportedWallet[]>;
    getAddress(): Promise<{ address: string }>;
    signTransaction(
      xdr: string,
      options?: Record<string, unknown>,
    ): Promise<{ signedTxXdr: string }>;
    disconnect(): Promise<void>;
  }
}
