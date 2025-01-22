import * as React from 'react';
import { fetchPriceWithFallback, fetchWalletDataWithFallback } from '@common/api';

// Components
import ActionBar from '@components/ActionBar';
import ActionButton from '@components/ActionButton';
import Alert from '@components/AlertBanner';
import BlockLoader from '@components/BlockLoader';
import Button from '@components/Button';
import Card from '@components/Card';
import DataTable from '@components/DataTable';
import Divider from '@components/Divider';
import RowSpaceBetween from '@components/RowSpaceBetween';
import Text from '@components/Text';
import Accordion from '@components/Accordion';
import Input from '@components/Input';
import Navigation from '@components/Navigation';
import Badge from '@components/Badge';
import Row from '@components/Row';
import Checkbox from '@components/Checkbox';
import ButtonGroup from '@components/ButtonGroup';
import Grid from '@components/Grid';

// Constants
const STORAGE_KEY = 'btc-wallet-data';
const SETTINGS_KEY = 'btc-wallet-settings';
const WALLETS_KEY = 'btc-wallets';

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

const formatNumber = (value: number | string, minimumFractionDigits = 2, maximumFractionDigits = 8): string => {
  const numValue = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (Number.isNaN(numValue)) return '0';

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits: Math.min(maximumFractionDigits, 20),
  }).format(numValue);
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

  // Form States
  const [newWalletName, setNewWalletName] = React.useState('');
  const [newWalletAddress, setNewWalletAddress] = React.useState('');
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

      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) setWalletData(JSON.parse(storedData));
    } catch (e) {
      console.error('Error loading stored data:', e);
    }
  }, []);

  const [pendingSettings, setPendingSettings] = React.useState<Settings>(settings);
  const refreshTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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
      }, 60000);

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
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        }
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

    setIsLoading(true);
    setError(null);

    try {
      const { balance, transactions } = await fetchWalletDataWithFallback(settings.walletAddress);

      setWalletData((prev) => {
        const usdValue = balance * prev.btcPrice;
        const eurValue = balance * prev.btcPriceEUR;

        const newData = {
          ...prev,
          balance,
          usdValue,
          eurValue,
          transactions,
          lastUpdated: Date.now(),
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        }
        return newData;
      });
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      setError('Failed to fetch wallet data. Please try again later.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [settings.walletAddress]);

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

  const handleAddWallet = () => {
    if (!validateBTCAddress(newWalletAddress)) {
      setError('Invalid BTC address format');
      return;
    }

    const newWallet: Wallet = {
      id: String(Date.now()),
      name: newWalletName || 'Main',
      address: newWalletAddress,
    };

    const updatedWallets = [...wallets, newWallet];
    setWallets(updatedWallets);
    if (typeof window !== 'undefined') {
      localStorage.setItem(WALLETS_KEY, JSON.stringify(updatedWallets));
    }
    setNewWalletName('');
    setNewWalletAddress('');
    selectWallet(newWallet);
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

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
  };

  const getCurrentWalletName = () => {
    if (!isClientSide) return 'Main';
    const currentWallet = wallets.find((w) => w.address === settings.walletAddress);
    return currentWallet?.name || 'Main';
  };

  const formatValue = (value: number | string, isBTCValue = false) => {
    if (settings.hideValues && isBTCValue) return '********';
    return typeof value === 'number' ? formatNumber(value, value < 1 ? 8 : 2) : value;
  };

  const formatCurrencyValue = (value: number | undefined) => {
    if (typeof value === 'undefined') return '';
    const formattedValue = formatNumber(value);
    return settings.currency === 'USD' ? `$${formatValue(formattedValue, true)}` : `€${formatValue(formattedValue, true)}`;
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
          {wallets.map((wallet) => (
            <Card key={wallet.id} title={editWallet?.id === wallet.id ? <Input name="edit-name" value={editWallet.name} onChange={(e) => setEditWallet({ ...editWallet, name: e.target.value })} autoFocus /> : wallet.name}>
              {editWallet?.id === wallet.id ? (
                <>
                  <Input name="edit-address" value={editWallet.address} onChange={(e) => setEditWallet({ ...editWallet, address: e.target.value })} placeholder="BTC address" style={{ marginBottom: '1ch' }} />
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
                </>
              ) : (
                <>
                  <Text style={{ opacity: 0.7 }}>{wallet.address.slice(0, 16)}...</Text>
                  <div style={{ display: 'flex', gap: '1ch', marginTop: '1ch' }}>
                    <Badge>{wallet.address === settings.walletAddress ? 'Active' : 'Inactive'}</Badge>
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
                </>
              )}
            </Card>
          ))}

          <Card title="Add New Wallet">
            <Input name="wallet-name" value={newWalletName} onChange={(e) => setNewWalletName(e.target.value)} placeholder="Wallet name" style={{ marginBottom: '1ch' }} />
            <Input name="wallet-address" value={newWalletAddress} onChange={(e) => setNewWalletAddress(e.target.value)} placeholder="BTC address" style={{ marginBottom: '1ch' }} />
            <Button onClick={handleAddWallet} theme="SECONDARY">
              Add Wallet
            </Button>
          </Card>
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
                Auto refresh (60s)
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
          <RowSpaceBetween>
            <Text>Balance</Text>
            <Text>{!settings.walletAddress ? '--' : formatValue(walletData.balance, true)} BTC</Text>
          </RowSpaceBetween>
          <RowSpaceBetween>
            <Text>Value</Text>
            <Text>{!settings.walletAddress ? '--' : formatCurrencyValue(settings.currency === 'EUR' ? walletData.eurValue : walletData.usdValue)}</Text>
          </RowSpaceBetween>
          <RowSpaceBetween>
            <Text>Price</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1ch' }}>
              <Badge
                style={{
                  color: walletData.priceChange >= 0 ? 'var(--theme-success)' : 'var(--theme-error)',
                }}
              >
                {formatPercentage(walletData.priceChange)}%
              </Badge>
              <Text>{getBTCPrice()}</Text>
            </div>
          </RowSpaceBetween>

          <Divider />

          <Card title="Sats Converter">
            <Input value={satsAmount} onChange={handleSatsInputChange} placeholder="Enter amount in sats" style={{ width: '100%', maxWidth: '42ch', marginBottom: '1ch' }} />
            {convertedUSD && convertedEUR && <Text>≈ {settings.currency === 'USD' ? `$${convertedUSD}` : `€${convertedEUR}`}</Text>}
          </Card>

          {settings.walletAddress ? (
            <Card title="Recent Transactions">
              <RowSpaceBetween>
                <Text>Synced</Text>
                <Badge>{new Date(walletData.lastUpdated).toLocaleString('de-DE', { hour12: false })}</Badge>
              </RowSpaceBetween>
              <DataTable
                data={walletData.transactions.slice(0, 3).map((tx: Transaction) => {
                  const value = settings.currency === 'EUR' ? (tx.value / 100000000) * walletData.btcPriceEUR : (tx.value / 100000000) * walletData.btcPrice;
                  const satsFormatted = formatNumber(tx.value, 0);

                  return [
                    new Date(tx.confirmed).toLocaleDateString('en-US', {
                      month: 'numeric',
                      day: 'numeric',
                      year: '2-digit',
                    }),
                    tx.tx_input_n === -1 ? '↓' : '↑',
                    formatValue(`${satsFormatted} sats`, true),
                    formatCurrencyValue(value),
                  ].map(String);
                })}
              />
            </Card>
          ) : (
            <Accordion title="Recent Transactions">
              <Text>No wallet address set</Text>
            </Accordion>
          )}

          <Divider />

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
    </>
  );
}
