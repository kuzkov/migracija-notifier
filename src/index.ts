import { Context, Telegraf } from "telegraf";
import { TELEGRAF_BOT_TOKEN } from "./env";
import Parser from "./parser";

// @ts-ignore
import Calendar from "telegraf-calendar-telegram";

const bot = new Telegraf(TELEGRAF_BOT_TOKEN as string);
const calendar = new Calendar(bot);
const parser = new Parser();

bot.start((context) => {
  context.reply("Hello");
});

bot.command("starttracking", (context) => {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setMonth(today.getMonth() + 2);
  maxDate.setDate(today.getDate());

  context.reply(
    "Введите по какое число включительно вы хотите искать свободные слоты",
    calendar.setMinDate(today).setMaxDate(maxDate).getCalendar()
  );
});

bot.command("stoptracking", (context) => {
  parser.unsubscribe(context.chat.id);
  context.reply("You successfully canceled subscription");
});

calendar.setDateListener((context: Context, date: string) => {
  context.reply("You successfully subscribed!");

  parser.subscribe({
    chatId: context.chat?.id!,
    date: new Date(date),
    callback: notifyUser,
  });
});

const notifyUser = (chatId: number, availableDates: Date[]) => {
  bot.telegram.sendMessage(chatId, "Successfully found such available dates:");
  bot.telegram.sendMessage(chatId, availableDates.toString());
};

bot.help((ctx) => {
  ctx.reply(
    "Send /start to receive a greeting\n" +
      "Send /starttracking to start tracking available slots\n" +
      "Send /stoptracking to stop tracking available slots\n" +
      "Send /quit to stop the bot"
  );
});

bot.command("quit", (ctx) => {
  ctx.telegram.leaveChat(ctx.message.chat.id);
  ctx.leaveChat();
});

bot.launch();
parser.start();

const stop = (code: string) => {
  bot.stop(code);
  parser.stop();
};

process.once("SIGINT", () => stop("SIGINT"));
process.once("SIGTERM", () => stop("SIGTERM"));
