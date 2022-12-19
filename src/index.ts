import { Context, Markup, Scenes, Telegraf } from "telegraf";
import { TELEGRAF_BOT_TOKEN } from "./env";
import LocalSession from "telegraf-session-local";

// @ts-ignore
import Calendar from "telegraf-calendar-telegram";

const bot = new Telegraf<SceneContextMessageUpdate>(
  TELEGRAF_BOT_TOKEN as string
);
const localSession = new LocalSession({ database: "data/local.json" });

bot.use(localSession.middleware());

const baseScene = new Scenes.BaseScene("base_scene");

baseScene.enter((context) => {
  context.reply("Base scene");
});

const stage = new Scenes.Stage([baseScene]);

bot.use(stage.middleware());

// Start bot
bot.start((context) => {
  context.scene.enter("base_scene");
});

// // Start tracking
// bot.command("start_tracking", (context) =>
//   context.reply(
//     "Введите по какое число включительно вы хотите искать свободные слоты",
//     calendar.getCalendar()
//   )
// );

// calendar.setDateListener((context: Context, date: string) => {
//   context.reply(date);
// });

// // Help
// bot.help((ctx) => {
//   ctx.reply(
//     "Send /start to receive a greeting\n" +
//       "Send /start_tracking to start tracking available slots\n" +
//       "Send /stop_tracking to start tracking available slots\n" +
//       "Send /quit to stop the bot"
//   );
// });

bot.command("quit", (ctx) => {
  ctx.telegram.leaveChat(ctx.message.chat.id);
  ctx.leaveChat();
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
