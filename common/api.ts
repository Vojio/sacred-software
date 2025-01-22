const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

interface PriceData {
  btcPrice: number;
  btcPriceEUR: number;
  priceChange: number;
}

interface FetchOptions {
  headers?: Record<string, string>;
}

const PRICE_APIS = {
  COINGECKO: 'https://api.coingecko.com/api/v3',
  BINANCE: 'https://api.binance.com/api/v3',
  COINBASE: 'https://api.coinbase.com/v2',
};

const BLOCKCHAIN_APIS = {
  BLOCKCYPHER: 'https://api.blockcypher.com/v1/btc/main',
  BLOCKSTREAM: 'https://blockstream.info/api',
  MEMPOOL: 'https://mempool.space/api',
};

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: FetchOptions = {}, attempts = RETRY_ATTEMPTS): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (attempts === 1) throw error;
    await delay(RETRY_DELAY);
    return fetchWithRetry(url, options, attempts - 1);
  }
}

async function fetchPriceFromCoingecko(): Promise<PriceData> {
  const response = await fetchWithRetry(`${PRICE_APIS.COINGECKO}/simple/price?ids=bitcoin&vs_currencies=usd,eur&include_24hr_change=true`);
  const data = await response.json();
  return {
    btcPrice: data.bitcoin.usd,
    btcPriceEUR: data.bitcoin.eur,
    priceChange: data.bitcoin.usd_24h_change,
  };
}

async function fetchPriceFromBinance(): Promise<PriceData> {
  const [usdResponse, eurResponse] = await Promise.all([fetchWithRetry(`${PRICE_APIS.BINANCE}/ticker/24hr?symbol=BTCUSDT`), fetchWithRetry(`${PRICE_APIS.BINANCE}/ticker/24hr?symbol=BTCEUR`)]);

  const usdData = await usdResponse.json();
  const eurData = await eurResponse.json();

  return {
    btcPrice: Number.parseFloat(usdData.lastPrice),
    btcPriceEUR: Number.parseFloat(eurData.lastPrice),
    priceChange: Number.parseFloat(usdData.priceChangePercent),
  };
}

async function fetchPriceWithFallback(): Promise<PriceData> {
  const errors: Error[] = [];

  try {
    return await fetchPriceFromCoingecko();
  } catch (error) {
    console.warn('Coingecko API failed, trying Binance...', error);
    errors.push(error as Error);
  }

  try {
    return await fetchPriceFromBinance();
  } catch (error) {
    console.error('All price APIs failed', error);
    errors.push(error as Error);
    throw new Error(`Failed to fetch prices: ${errors.map((e) => e.message).join(', ')}`);
  }
}

async function fetchWalletDataWithFallback(address: string) {
  for (const [name, baseUrl] of Object.entries(BLOCKCHAIN_APIS)) {
    try {
      const response = await fetchWithRetry(`${baseUrl}/addrs/${address}`);
      const data = await response.json();
      return {
        balance: data.balance / 100000000,
        transactions: data.txrefs?.slice(0, 5) || [],
      };
    } catch (error) {
      console.warn(`${name} API failed, trying next...`, error);
    }
  }
  throw new Error('All blockchain APIs failed');
}

export { fetchPriceWithFallback, fetchWalletDataWithFallback };
