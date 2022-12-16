import { Context, Markup, Telegraf } from "telegraf";
import { Update } from "typegram";
import { TELEGRAF_BOT_TOKEN } from "./env";

// @ts-ignore
import Calendar from "telegraf-calendar-telegram";

const bot: Telegraf<Context<Update>> = new Telegraf(
  TELEGRAF_BOT_TOKEN as string
);

const calendar = new Calendar(bot);

// Start bot
bot.start((ctx) => {
  ctx.reply("Hello " + ctx.from.first_name + "!");
});

// Start tracking
bot.command("start_tracking", (context) =>
  context.reply(
    "Введите по какое число включительно вы хотите искать свободные слоты",
    calendar.getCalendar()
  )
);

calendar.setDateListener((context: Context, date: string) => {
  context.reply(date);
});

// Help
bot.help((ctx) => {
  ctx.reply(
    "Send /start to receive a greeting\n" +
      "Send /start_tracking to start tracking available slots\n" +
      "Send /stop_tracking to start tracking available slots\n" +
      "Send /quit to stop the bot"
  );
});

bot.command("quit", (ctx) => {
  ctx.telegram.leaveChat(ctx.message.chat.id);
  ctx.leaveChat();
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
