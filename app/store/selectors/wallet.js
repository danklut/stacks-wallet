import { microToStacks, stacksToMicro } from "stacks-utils";

const selectWalletHistory = state =>
  state.wallet.data ? state.wallet.data.history : [];

const selectWalletStacksAddress = state => state.wallet.addresses.stx;

const selectWalletBitcoinAddress = state => state.wallet.addresses.btc;

const selectWalletBitcoinBalance = state =>
  state.wallet.data &&
  state.wallet.data.balances &&
  state.wallet.data.balances.confirmed;

const selectWalletType = state => state.wallet.type;

const selectWalletBalance = state => state.wallet.balances.stx;

const selectWalletLoading = state => state.wallet.loading;

const selectWalletData = state => state.wallet.data;

const selectWalletError = state => state.wallet.error;

const selectWalletLastFetch = state => state.wallet.lastFetch;

const selectWalletIsFetchingBalances = state => state.wallet.fetchingBalances;

const selectWalletIsFetchingAddressData = state =>
  state.wallet.fetchingAddressData;

const selectWalletIsFetching = state => {
  const fetchingBalances = selectWalletIsFetchingBalances(state);
  const fetchingAddressData = selectWalletIsFetchingAddressData(state);

  return fetchingBalances || fetchingAddressData;
};

const selectPendingTxs = state =>
  state.wallet.data
    ? state.wallet.data.transactions.filter(tx => tx.pending && !tx.invalid)
    : [];

const selectRawTxs = state =>
  state.wallet.data ? state.wallet.data.transactions : [];

const selectPendingBalance = state => {
  const thisAddress = selectWalletStacksAddress(state);
  const balance = microToStacks(selectWalletBalance(state));
  const pendingTxs = selectPendingTxs(state);
  let difference = 0;
  if (pendingTxs && pendingTxs.length) {
    pendingTxs.forEach(tx => {
      const isSent = tx.sender === thisAddress;
      const amount = isSent
        ? Number(tx.tokenAmountReadable) * -1
        : Number(tx.tokenAmountReadable);
      difference += amount;
    });
  }
  if (difference !== 0) {
    return stacksToMicro(balance + difference);
  }
  return null;
};

export {
  selectWalletHistory,
  selectWalletBalance,
  selectWalletStacksAddress,
  selectWalletType,
  selectWalletBitcoinAddress,
  selectWalletBitcoinBalance,
  selectWalletLoading,
  selectWalletData,
  selectWalletError,
  selectPendingTxs,
  selectRawTxs,
  selectWalletLastFetch,
  selectPendingBalance,
  selectWalletIsFetching
};
