import * as React from 'react';
import { fetchPriceWithFallback, fetchWalletDataWithFallback } from '@common/api';

// Components
import ActionBar from '@components/ActionBar';
import ActionButton from '@components/ActionButton';
import Alert from '@components/AlertBanner';
import BlockLoader from '@components/BlockLoader';
import Button from '@components/Button';
import Card from '@components/Card';
import Divider from '@components/Divider';
import RowSpaceBetween from '@components/RowSpaceBetween';
import Text from '@components/Text';
import Input from '@components/Input';
import Navigation from '@components/Navigation';
import Badge from '@components/Badge';
import Row from '@components/Row';
import Checkbox from '@components/Checkbox';
import ButtonGroup from '@components/ButtonGroup';
import Grid from '@components/Grid';
import Table from '@components/Table';
import TableRow from '@components/TableRow';
import TableColumn from '@components/TableColumn';
import ModalTrigger from '@components/ModalTrigger';
import ModalTransaction from '@components/modals/ModalTransaction';
import ModalStack from '@components/ModalStack';
import ModalNewWallet from '@components/modals/ModalNewWallet';

// Constants
const STORAGE_KEY = 'btc-wallet-data';
const SETTINGS_KEY = 'btc-wallet-settings';
const WALLETS_KEY = 'btc-wallets';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Types
interface Wallet {
  id: string;
  name: string;
  address: string;
  isEditing?: boolean;
  data?: WalletData;
}

interface Settings {
  walletAddress: string;
  hideValues: boolean;
  currency: 'USD' | 'EUR';
  autoRefresh: boolean;
}

interface Transaction {
  confirmed: string;
  tx_input_n: number;
  value: number;
  hash?: string;
}

interface WalletData {
  balance: number;
  usdValue: number;
  eurValue: number;
  priceChange: number;
  btcPrice: number;
  btcPriceEUR: number;
  transactions: Transaction[];
  lastUpdated: number;
}

const formatNumber = (value: number | string, minimumFractionDigits = 2, maximumFractionDigits = 8): string => {
  const numValue = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (Number.isNaN(numValue)) return '0';

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits: Math.min(maximumFractionDigits, 20),
  }).format(numValue);
};

const formatValue = (value: number | string, hideValues: boolean, isCurrency = false) => {
  if (hideValues) {
    return isCurrency ? '****' : '********';
  }
  return typeof value === 'number' ? formatNumber(value, value < 1 ? 8 : 2) : value;
};

const defaultSettings: Settings = {
  walletAddress: '',
  hideValues: false,
  currency: 'USD',
  autoRefresh: true,
};

const initialWalletData: WalletData = {
  balance: 0,
  usdValue: 0,
  eurValue: 0,
  priceChange: 0,
  btcPrice: 0,
  btcPriceEUR: 0,
  transactions: [],
  lastUpdated: 0,
};

const BTC_ADDRESS_REGEX = {
  LEGACY: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
  SEGWIT: /^bc1[ac-hj-np-z02-9]{11,71}$/,
  NATIVE_SEGWIT: /^(bc1)[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{11,71}$/,
  TAPROOT: /^bc1p[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{11,71}$/,
};

const validateBTCAddress = (address: string): boolean => {
  return BTC_ADDRESS_REGEX.LEGACY.test(address) || BTC_ADDRESS_REGEX.SEGWIT.test(address) || BTC_ADDRESS_REGEX.NATIVE_SEGWIT.test(address) || BTC_ADDRESS_REGEX.TAPROOT.test(address);
};

export default function BTCWallet() {
  // State Management
  const [satsAmount, setSatsAmount] = React.useState('');
  const [convertedUSD, setConvertedUSD] = React.useState('');
  const [convertedEUR, setConvertedEUR] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showWalletSelector, setShowWalletSelector] = React.useState(false);
  const [dataSource, setDataSource] = React.useState<'cache' | 'fresh'>('fresh');

  // Form States
  const [editWallet, setEditWallet] = React.useState<Wallet | null>(null);

  // Persisted States
  const [settings, setSettings] = React.useState<Settings>(defaultSettings);
  const [wallets, setWallets] = React.useState<Wallet[]>([]);
  const [walletData, setWalletData] = React.useState<WalletData>(initialWalletData);
  const [isClientSide, setIsClientSide] = React.useState(false);

  React.useEffect(() => {
    setIsClientSide(true);
    try {
      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      if (storedSettings) setSettings(JSON.parse(storedSettings));

      const storedWallets = localStorage.getItem(WALLETS_KEY);
      if (storedWallets) setWallets(JSON.parse(storedWallets));
    } catch (e) {
      console.error('Error loading stored data:', e);
    }
  }, []);

  const [pendingSettings, setPendingSettings] = React.useState<Settings>(settings);
  const refreshTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const walletDataCacheRef = React.useRef<{ [address: string]: WalletData }>({});

  // Effects
  React.useEffect(() => {
    fetchBTCPrice();
  }, []);

  React.useEffect(() => {
    if (settings.walletAddress) {
      fetchWalletData();
    }
  }, [settings.walletAddress]);

  React.useEffect(() => {
    if (settings.autoRefresh) {
      const interval = setInterval(() => {
        if (!isRefreshing && settings.walletAddress) {
          setIsRefreshing(true);
          Promise.all([fetchBTCPrice(), fetchWalletData()]).finally(() => setIsRefreshing(false));
        }
      }, 300000);

      return () => {
        clearInterval(interval);
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
      };
    }
  }, [settings.autoRefresh, settings.walletAddress, isRefreshing]);

  React.useEffect(() => {
    if (satsAmount && walletData.btcPrice) {
      const sats = Number.parseFloat(satsAmount.replace(/,/g, ''));
      if (Number.isNaN(sats)) {
        setConvertedUSD('');
        setConvertedEUR('');
        return;
      }

      const btcAmount = sats / 100000000;
      const usdValue = btcAmount * walletData.btcPrice;
      const eurValue = btcAmount * walletData.btcPriceEUR;

      setConvertedUSD(formatNumber(usdValue));
      setConvertedEUR(formatNumber(eurValue));
    } else {
      setConvertedUSD('');
      setConvertedEUR('');
    }
  }, [satsAmount, walletData.btcPrice, walletData.btcPriceEUR]);

  // API Calls
  const fetchBTCPrice = React.useCallback(async () => {
    try {
      const priceData = await fetchPriceWithFallback();
      setWalletData((prev) => {
        const newData = {
          ...prev,
          btcPrice: priceData.btcPrice,
          btcPriceEUR: priceData.btcPriceEUR,
          priceChange: priceData.priceChange,
          lastUpdated: Date.now(),
        };
        return newData;
      });
    } catch (error) {
      console.error('Error fetching BTC price:', error);
      setError('Failed to fetch price data. Will retry automatically.');
      refreshTimeoutRef.current = setTimeout(fetchBTCPrice, 30000);
    }
  }, []);

  const fetchWalletData = React.useCallback(async () => {
    if (!settings.walletAddress) return;

    const cachedData = walletDataCacheRef.current[settings.walletAddress];
    if (cachedData) {
      const isCacheFresh = Date.now() - cachedData.lastUpdated < CACHE_DURATION;
      if (isCacheFresh && cachedData.balance !== undefined && cachedData.btcPrice !== undefined && cachedData.btcPriceEUR !== undefined) {
        setWalletData(cachedData);
        setDataSource('cache');
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const { balance, transactions } = await fetchWalletDataWithFallback(settings.walletAddress);
      const priceData = await fetchPriceWithFallback();

      setWalletData((prev) => {
        const usdValue = balance * priceData.btcPrice;
        const eurValue = balance * priceData.btcPriceEUR;

        const newData = {
          ...prev,
          balance,
          usdValue,
          eurValue,
          transactions,
          btcPrice: priceData.btcPrice,
          btcPriceEUR: priceData.btcPriceEUR,
          priceChange: priceData.priceChange,
          lastUpdated: Date.now(),
        };

        walletDataCacheRef.current[settings.walletAddress] = newData;
        return newData;
      });
      setDataSource('fresh');
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      setError('Failed to fetch wallet data. Please try again later.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [settings.walletAddress]);

  const handleAddWalletModal = (name: string, address: string) => {
    if (!address || !name) {
      setError('Missing wallet name or address');
      return;
    }
    if (!validateBTCAddress(address)) {
      setError('Invalid BTC address format');
      return;
    }

    const newWallet: Wallet = {
      id: String(Date.now()),
      name: name || 'Main',
      address: address,
    };

    const updatedWallets = [...wallets, newWallet];
    setWallets(updatedWallets);
    if (typeof window !== 'undefined') {
      localStorage.setItem(WALLETS_KEY, JSON.stringify(updatedWallets));
    }
    selectWallet(newWallet);
  };

  // Event Handlers
  const handleUpdatePendingSettings = (newSettings: Partial<Settings>) => {
    setPendingSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleSaveSettings = () => {
    if (pendingSettings.walletAddress && !validateBTCAddress(pendingSettings.walletAddress)) {
      setError('Invalid BTC address format');
      return;
    }

    setSettings(pendingSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(pendingSettings));
    }
    setShowSettings(false);
    setError(null);
  };

  const handleUpdateWallet = (wallet: Wallet) => {
    if (!validateBTCAddress(wallet.address)) {
      setError('Invalid BTC address format');
      return;
    }

    const updatedWallets = wallets.map((w) => (w.id === wallet.id ? { ...wallet, isEditing: false } : w));

    setWallets(updatedWallets);
    if (typeof window !== 'undefined') {
      localStorage.setItem(WALLETS_KEY, JSON.stringify(updatedWallets));
    }
    setEditWallet(null);
  };

  const selectWallet = (wallet: Wallet) => {
    const newSettings = { ...settings, walletAddress: wallet.address };
    setSettings(newSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    }
    setShowWalletSelector(false);
  };

  const handleSatsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d,]/g, '');
    setSatsAmount(value);
  };

  // Utility Functions
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    }

    const diffInMinutes = Math.round(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }

    const diffInHours = Math.round(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }

    const diffInDays = Math.round(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }

    const diffInWeeks = Math.round(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
    }

    const diffInMonths = Math.round(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
    }

    const diffInYears = Math.round(diffInDays / 365);
    return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
  };

  const getCurrentWalletName = () => {
    if (!isClientSide) return 'Main';
    const currentWallet = wallets.find((w) => w.address === settings.walletAddress);
    return currentWallet?.name || 'Main';
  };

  const formatCurrencyValue = (value: number | undefined) => {
    if (typeof value === 'undefined') return '';
    const formattedValue = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return settings.currency === 'USD' ? `$${formattedValue}` : `€${formattedValue}`;
  };

  const getBTCPrice = () => {
    const price = settings.currency === 'EUR' ? walletData.btcPriceEUR : walletData.btcPrice;
    return formatCurrencyValue(price);
  };

  // Render
  return (
    <>
      <Navigation
        logo="₿"
        left={<ActionButton onClick={() => setShowWalletSelector(!showWalletSelector)}>{getCurrentWalletName()}</ActionButton>}
        right={
          <ActionBar
            items={[
              {
                body: 'SETTINGS',
                hotkey: '⌃+S',
                onClick: () => {
                  setShowSettings(!showSettings);
                  setPendingSettings(settings);
                },
                selected: showSettings,
              },
            ]}
          />
        }
      />

      {error && <Alert>{error}</Alert>}
      {showWalletSelector && (
        <Grid>
          <Card title="Manage Wallets">
            {wallets.map((wallet) => (
              <Row key={wallet.id} style={{ marginBottom: '1ch', padding: '1ch', background: editWallet?.id === wallet.id ? 'var(--theme-focused-foreground)' : 'transparent' }}>
                {editWallet?.id === wallet.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1ch', width: '100%' }}>
                    <Input name="edit-name" value={editWallet.name} onChange={(e) => setEditWallet({ ...editWallet, name: e.target.value })} autoFocus placeholder="Wallet name" />
                    <Input name="edit-address" value={editWallet.address} onChange={(e) => setEditWallet({ ...editWallet, address: e.target.value })} placeholder="BTC address" />
                    <ButtonGroup
                      items={[
                        {
                          body: 'Save',
                          onClick: () => handleUpdateWallet(editWallet),
                        },
                        {
                          body: 'Cancel',
                          onClick: () => setEditWallet(null),
                        },
                      ]}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div>
                      <Text style={{}}>{wallet.name}</Text>
                      <Text style={{ opacity: 0.7, fontSize: '0.8em' }}>{wallet.address.slice(0, 16)}...</Text>
                    </div>
                    <div style={{ display: 'flex', gap: '1ch' }}>
                      <Badge>{wallet.address === settings.walletAddress ? 'Active' : ''}</Badge>
                      <Badge
                        onClick={() =>
                          setEditWallet({
                            id: wallet.id,
                            name: wallet.name,
                            address: wallet.address,
                          })
                        }
                        style={{ cursor: 'pointer' }}
                      >
                        Edit
                      </Badge>
                      <Badge onClick={() => selectWallet(wallet)} style={{ cursor: 'pointer' }}>
                        Select
                      </Badge>
                    </div>
                  </div>
                )}
              </Row>
            ))}
          </Card>

          <ModalTrigger
            modal={ModalNewWallet}
            modalProps={{
              onAddWallet: handleAddWalletModal,
            }}
          >
            <ActionButton>Add New Wallet</ActionButton>
          </ModalTrigger>
        </Grid>
      )}

      {isLoading && <BlockLoader />}

      {showSettings ? (
        <>
          <Card title="Settings">
            <Row>
              <Input name="Address input" label="Bitcoin Address" autoComplete="off" value={pendingSettings.walletAddress} onChange={(e) => handleUpdatePendingSettings({ walletAddress: e.target.value })} placeholder="Set BTC address" />
            </Row>
            <Divider />
            <Row>
              <Text>Visibility</Text>
              <Checkbox name="hideValues" defaultChecked={pendingSettings.hideValues} onChange={(e) => handleUpdatePendingSettings({ hideValues: e.target.checked })}>
                Hide wallet balance
              </Checkbox>
            </Row>
            <Row>
              <Text>Auto Refresh</Text>
              <Checkbox name="autoRefresh" defaultChecked={pendingSettings.autoRefresh} onChange={(e) => handleUpdatePendingSettings({ autoRefresh: e.target.checked })}>
                Auto refresh (5min)
              </Checkbox>
            </Row>
            <Row>
              <Text>Currency</Text>
              <ButtonGroup
                items={[
                  {
                    body: 'USD',
                    onClick: () => handleUpdatePendingSettings({ currency: 'USD' }),
                    selected: pendingSettings.currency === 'USD',
                  },
                  {
                    body: 'EUR',
                    onClick: () => handleUpdatePendingSettings({ currency: 'EUR' }),
                    selected: pendingSettings.currency === 'EUR',
                  },
                ]}
              />
            </Row>
          </Card>
          <br />
          <Button onClick={handleSaveSettings} theme="SECONDARY">
            Save Settings
          </Button>
        </>
      ) : (
        <>
          <br />
          <Card title="Overview">
            <RowSpaceBetween>
              <Text>Data Source</Text>
              <Badge>{dataSource === 'cache' ? 'CACHED' : 'FRESH'}</Badge>
            </RowSpaceBetween>
            <RowSpaceBetween>
              <Text>Balance</Text>
              <Text>₿{!settings.walletAddress ? '--' : formatValue(walletData.balance, settings.hideValues)}</Text>{' '}
            </RowSpaceBetween>
            <RowSpaceBetween>
              <Text>Value</Text>
              <Text>{!settings.walletAddress ? '--' : settings.hideValues ? '****' : formatCurrencyValue(settings.currency === 'EUR' ? walletData.eurValue : walletData.usdValue)}</Text>
            </RowSpaceBetween>
            <RowSpaceBetween>
              <Text>Price</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1ch' }}>
                <Badge>{formatPercentage(walletData.priceChange)}%</Badge>
                <Text>{getBTCPrice()}</Text>
              </div>
            </RowSpaceBetween>
          </Card>

          <br />

          {settings.walletAddress ? (
            <Card title="Recent Transactions">
              <RowSpaceBetween>
                <Text>LAST UPDATED</Text>
                <div style={{ display: 'flex', gap: '1ch', alignItems: 'center' }}>
                  <Badge>{dataSource === 'cache' ? 'CACHED' : 'FRESH'}</Badge>
                  <Badge>{new Date(walletData.lastUpdated).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</Badge>
                </div>
              </RowSpaceBetween>
              <Table>
                <TableRow>
                  <TableColumn>TIME</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>SATS</TableColumn>
                </TableRow>
                {walletData.transactions.slice(0, 3).map((tx, i) => {
                  const satsFormatted = formatNumber(tx.value, 0);

                  return (
                    <ModalTrigger
                      key={tx.hash || i}
                      modal={ModalTransaction}
                      modalProps={{
                        transaction: tx,
                        btcPrice: walletData.btcPrice,
                        btcPriceEUR: walletData.btcPriceEUR,
                        currency: settings.currency,
                        hideValues: settings.hideValues,
                        buttonText: 'Close',
                      }}
                    >
                      <TableRow style={{ cursor: 'pointer' }}>
                        <TableColumn>{formatTimeAgo(tx.confirmed)}</TableColumn>
                        <TableColumn>{tx.tx_input_n === -1 ? '↓ IN' : '↑ OUT'}</TableColumn>
                        <TableColumn>{formatValue(satsFormatted, settings.hideValues)}</TableColumn>
                      </TableRow>
                    </ModalTrigger>
                  );
                })}
              </Table>
            </Card>
          ) : (
            <Card title="Recent Transactions">
              <Text>No wallet address set</Text>
            </Card>
          )}

          <br />

          <Card title="Converter">
            <Input value={satsAmount} onChange={handleSatsInputChange} placeholder="Enter amount" label="Amount in Satoshis" autoComplete="off" style={{ width: '100%', maxWidth: '42ch', marginBottom: '1ch' }} />
            <RowSpaceBetween>
              <Text>USD Value</Text>
              <Text>{convertedUSD ? `$${convertedUSD}` : '--'}</Text>
            </RowSpaceBetween>
            <RowSpaceBetween>
              <Text>EUR Value</Text>
              <Text>{convertedEUR ? `€${convertedEUR}` : '--'}</Text>
            </RowSpaceBetween>
            <Text style={{ opacity: 0.5, marginTop: '1ch' }}>{satsAmount && !Number.isNaN(Number(satsAmount.replace(/,/g, ''))) ? `${(Number(satsAmount.replace(/,/g, '')) / 100000000).toFixed(8)} BTC` : '0.00000000 BTC'}</Text>
          </Card>

          <br />

          <Button
            theme="SECONDARY"
            onClick={() => {
              setIsRefreshing(true);
              Promise.all([fetchWalletData(), fetchBTCPrice()]).finally(() => setIsRefreshing(false));
            }}
            isDisabled={!settings.walletAddress || isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
          </Button>
        </>
      )}
      <ModalStack />
    </>
  );
}
