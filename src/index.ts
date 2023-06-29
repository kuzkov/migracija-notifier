import { Context, Markup, Telegraf, session } from "telegraf";
import { TELEGRAF_BOT_TOKEN } from "./env";
import Parser from "./parser";
import dayjs from "dayjs";
import { Scenes } from "telegraf";

// @ts-ignore
import Calendar from "telegraf-calendar-telegram";

import "dayjs/locale/ru";
import { VisitType, fetchInstitutions } from "./api";

dayjs.locale("ru");

const bot = new Telegraf(TELEGRAF_BOT_TOKEN as string);

bot.use(session());

const calendar = new Calendar(bot);
const parser = new Parser(resolve, reject);

const visitTypeOptions = {
  [VisitType.PassportAndIdentityCardSubmission]:
    "Passport, identity card - application submission",
  [VisitType.PassportAndIdentityCardCollection]:
    "Passport, identity card - collection",
  [VisitType.PersonalisingResidencePermit]:
    "Personalising a residence permit (submission of biometric data)",
  [VisitType.VisaApplicationSubmission]: "Visa - application submission",
  [VisitType.CollectionOfDocumentsOfForeigners]:
    "Documents issued to foreigners - collection",
  [VisitType.ConsultationOnMigration]:
    "Consultation on migration and Lithuanian citizenship issues",
  [VisitType.IltuCodeAssignment]: "ILTU code assignment",
};

const START_TRACKING_WIZARD = "START_TRACKING_WIZARD";

const wizardState = [];

const startTrackingWizard = new Scenes.WizardScene(
  START_TRACKING_WIZARD,
  (ctx: any) => {
    ctx.reply(
      "📌 Выбери нужный тип визита",
      Markup.keyboard(Object.values(visitTypeOptions)).oneTime().resize()
    );

    return ctx.wizard.next();
  },
  async (ctx: any) => {
    if (!Object.values(visitTypeOptions).includes(ctx.message.text)) {
      ctx.reply(
        "🔽 Пожалуйста, выберите один из предложенных вариантов из меню"
      );
      return;
    }

    const visitType = getKeyByValue(visitTypeOptions, ctx.message.text)!;
    const locations = await fetchInstitutions(visitType as VisitType);

    ctx.session.visitType = visitType;
    ctx.session.locations = locations;

    ctx.reply(
      "🏢 Пожалуйста, выберите нужный адрес учреждения из представленных вариантов",
      Markup.keyboard(locations.map((location) => location.titleLt))
        .oneTime()
        .resize()
    );

    return ctx.wizard.next();
  },
  async (ctx: any) => {
    const locations = ctx.session.locations;
    const chosenLocation = locations.find(
      (location: any) => location.titleLt === ctx.message.text
    );

    if (!chosenLocation) {
      ctx.reply(
        "🔽 Пожалуйста, выберите один из предложенных вариантов из меню"
      );
      return;
    }

    const today = new Date();
    const maxDate = new Date();

    ctx.session.institution = chosenLocation;

    maxDate.setMonth(today.getMonth() + 2);
    maxDate.setDate(today.getDate());

    ctx.reply(
      "📅 Укажите конечную дату, до которой вы хотите найти свободные слоты.",
      calendar.setMinDate(today).setMaxDate(maxDate).getCalendar()
    );

    return ctx.scene.leave();
  }
);

calendar.setDateListener((context: any, date: string) => {
  context.reply(
    "🔍 Я начал поиск свободных слотов. Как только они появятся, я пришлю вам сообщение. Чтобы прекратить поиск, вы можете нажать /stoptracking."
  );

  const visitType = context.session.visitType;
  const institution = context.session.institution;

  parser.subscribe({
    chatId: context.chat?.id!,
    date: new Date(date),
    institution,
    visitType,
  });
});

function getKeyByValue(object: any, value: any) {
  return Object.keys(object).find((key) => object[key] === value);
}

const stage = new Scenes.Stage([startTrackingWizard]);

bot.use(stage.middleware());

function resolve(chatId: number, availableDates: Date[]) {
  bot.telegram.sendMessage(
    chatId,
    "🎉 Мы нашли свободные слоты для вас! Вот информация о них:\n\n" +
      availableDates
        .map(
          (date, index) =>
            `${index + 1}. ${dayjs(date).format("D MMMM YYYY")}\n`
        )
        .join("") +
      "\nПоторопитесь забронировать удобное время на сайте migracija.lt! ✨"
  );
}

function reject(chatId: number) {
  bot.telegram.sendMessage(
    chatId,
    "К сожалению, свободные слоты не найдены. " +
      "Пожалуйста, выберите другое время чтобы продолжить поиск. " +
      "Слоты могут стать доступными в другие даты или время. 🙏 🔍"
  );
}

bot.start((context) => {
  context.reply(
    "👋 Приветствую тебя!\n\n" +
      "Я бот 🤖, который поможет тебе быть в курсе свободных слотов в Департаменте миграции. 🗓️\n\n" +
      "Буду обновлять информацию за тебя и отправлять уведомления о новых доступных местах. ⚡️\n\n" +
      "Пока что бот может следить только за одной услугой в одном городе в один момент времени.\n\n" +
      "Чтобы начать поиск просто нажмите /starttracking, а чтобы закончить /stoptracking.\n\n" +
      "Удачи с оформлением документов! 🛂 ✨"
  );
});

bot.command("starttracking", (ctx: any) => {
  ctx.scene.enter(START_TRACKING_WIZARD);
});

bot.command("stoptracking", (context) => {
  parser.unsubscribe(context.chat.id);
  context.reply(
    "🛑 Поиск слотов прекращен. Если вы хотите возобновить поиск, просто нажмите /starttracking."
  );
});

bot.help((ctx) => {
  ctx.reply(
    "Вот список команд, которые вы можете использовать:\n\n" +
      "/start - Начать использование бота и получить приветственное сообщение.\n" +
      "/starttracking - Начать отслеживание свободных слотов.\n" +
      "/stoptracking - Остановить отслеживание свободных слотов.\n" +
      "/quit - Остановить работу бота.\n\n" +
      "Удачи в поиске свободных слотов для записи! 🚀 📅"
  );
});

bot.command("quit", (ctx) => {
  ctx.telegram.leaveChat(ctx.message.chat.id);
  ctx.leaveChat();
});

bot.launch();

const stop = (code: string) => {
  bot.stop(code);
  parser.stop();
};

process.once("SIGINT", () => stop("SIGINT"));
process.once("SIGTERM", () => stop("SIGTERM"));
