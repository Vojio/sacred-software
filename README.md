# SRCL

**[Live Demo](https://sacred.computer)**

**[My Demo](https://vojio-software.vercel.app/)**

SRCL is an open-source React component and style repository that helps you build web applications, desktop applications, and static websites with terminal aesthetics. Its modular, easy-to-use components emphasize precise monospace character spacing and line heights, enabling you to quickly copy and paste implementations while maintaining a clean, efficient codebase.

This update includes significant changes focusing on a Bitcoin wallet implementation, as well as new modal components.

## Key Changes:

### 1. Bitcoin Wallet Implementation (`components/examples/BTCWallet.tsx`)

-   A new `BTCWallet` component has been added, demonstrating a practical use case of the SRCL library.
-   This component features:
    -   Display of wallet balance, value in USD/EUR, and Bitcoin price.
    -   Integration with external APIs (CoinGecko, Blockcypher/Blockstream/Mempool) for fetching price and wallet data.
    -   Conversion tool for satoshis to USD/EUR.
    -   Display of recent transactions with modal detail views.
    -   Settings for currency, visibility, and auto-refresh.
    -   Basic wallet management (add/edit/select).
    -   Local storage for persisting settings and wallets.
-   It utilizes several SRCL components: `ActionBar`, `ActionButton`, `AlertBanner`, `BlockLoader`, `Button`, `Card`, `Divider`, `RowSpaceBetween`, `Text`, `Input`, `Navigation`, `Badge`, `Row`, `Checkbox`, `ButtonGroup`, `Grid`, `Table`, `TableRow`, `TableColumn`, `ModalTrigger`, `ModalStack`.
-   Demonstrates a complex component relying on fetching and managing data, state, and user preferences.

### 2. New Modal Components (`components/modals`)

-   Added modal components:
    -   `ModalTransaction.tsx`: Displays details of a Bitcoin transaction.
    -   `ModalNewWallet.tsx`: Provides a form to add a new wallet.
-   These modals utilize SRCL components like `Card`, `Text`, `Button`, `Input`, `Divider`, `ActionBar`, and `ActionButton`.
-   They showcase the modal management using `@components/page/ModalContext`.

### 3. File Structure Updates

-   New files under `components/examples`:
    -   `BTCWallet.tsx`
-   New files under `components/modals`:
    -   `ModalTransaction.tsx`
    -   `ModalNewWallet.tsx`
    -   `ModalTransaction.module.scss`
    -   `ModalNewWallet.module.scss`
-  The `EmptyState.tsx` component and module.scss file were created in the components directory.
-  `actionListItem` was imported from components instead of root in app/page.tsx.
-  The `api.ts` file was updated with improved error handling, and API fallback logic.
-  All relative imports were updated.


### 4. `common/api.ts`

-   Updated `fetchPriceWithFallback` to use both CoinGecko and Binance APIs for price fetching with a fallback mechanism.
-   Added a `fetchWalletDataWithFallback` function that attempts multiple blockchain explorers (Blockcypher, Blockstream, Mempool) to fetch wallet information.
-   Implements retry logic for API calls.

### 5. `app/page.tsx`

-   Modified to include the `BTCWallet` component within the main page layout.
-   Updated imports for the changed structure of the components.

### 6. General Changes

-   Added new Themes with auto light/dark mode styling in `global.scss`.

## Getting Started

```sh
npm install
npm run dev
```

Go to `http://localhost:10000` in your browser of choice.

We use [Vercel](https://vercel.com/home) for hosting.

### Scripts (Optional)

If you need to run node script without running the server, use this example to get started

```sh
npm run script example
```

### Contact

If you have questions ping me on Twitter, [@wwwjim](https://www.twitter.com/wwwjim). Or you can ping [@internetxstudio](https://x.com/internetxstudio).
