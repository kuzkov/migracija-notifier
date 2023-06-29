import fetch from "node-fetch";
import storage from "node-persist";
import { Institution, VisitType, fetchDates } from "./api";

interface Subscription {
  institution: Institution;
  visitType: VisitType;
  chatId: number;
  date: Date;
}

type ResolveCallback = (chatId: number, availableDates: Date[]) => void;

type RejectCallback = (chatId: number) => void;

export default class Parser {
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(
    private resolve: ResolveCallback,
    private reject: RejectCallback
  ) {
    this.init();
  }

  async init() {
    await storage.init();
    this.startInterval();
  }

  async subscribe(subscription: Subscription) {
    await storage.setItem(subscription.chatId.toString(), subscription);
  }

  async unsubscribe(chatId: Subscription["chatId"]) {
    await storage.removeItem(chatId.toString());
  }

  private startInterval() {
    this.intervalId = setInterval(async () => {
      await storage.forEach(async ({ value }) => {
        const chatId = value.chatId as number;
        const subscription = await storage.getItem(chatId.toString());
        const visitType = subscription.visitType;
        const institutionCode = subscription.institution.key;

        const date = new Date(value.date);
        const now = new Date();

        const dates = await fetchDates(visitType, institutionCode);

        const filteredDates = dates
          .map((currentDate) => new Date(currentDate))
          .filter((currentDate) => currentDate <= date);

        if (filteredDates.length) {
          this.resolve(chatId, filteredDates);
          this.unsubscribe(chatId);
        }

        if (now >= date) {
          this.reject(chatId);
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
