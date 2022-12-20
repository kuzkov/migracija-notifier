import fetch from "node-fetch";

// FIXME: Extract into a separate file with api
const endpoint =
  "https://www.migracija.lt/external/tickets/classif/KL45_10/KL02_87/dates";

const fetchDates = async () => {
  return (await fetch(`${endpoint}?t=${Date.now()}`).then((res) =>
    res.json()
  )) as string[];
};

interface Subscription {
  chatId: number;
  date: Date;
  callback: (chatId: Subscription["chatId"], availableDates: Date[]) => void;
}
export default class Parser {
  private subscriptions: Subscription[] = [];
  private intervalId?: ReturnType<typeof setInterval>;

  subscribe(subscription: Subscription) {
    this.subscriptions.push(subscription);
  }

  unsubscribe(chatId: Subscription["chatId"]) {
    this.subscriptions = this.subscriptions.filter(
      (subscription) => subscription.chatId !== chatId
    );
  }

  start() {
    this.intervalId = setInterval(async () => {
      // FIXME: Extract fetch and date deserialization into a separate function
      const result = await fetchDates();
      const dates = result.map((rawDate) => new Date(rawDate));

      // FIXME: Mutation of the subscriptions array is used inside foreach
      // that's why spread operator is used here
      [...this.subscriptions].forEach(({ date, chatId, callback }) => {
        const filteredDates = dates.filter(
          (currentDate) => currentDate <= date
        );

        if (filteredDates.length) {
          callback(chatId, filteredDates);
          this.unsubscribe(chatId);
        }
      });
    }, 10 * 1000); // FIXME: Magic constant
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
