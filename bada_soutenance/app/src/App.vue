<template>
  <v-app>
    <v-container>
      <v-row>
        <v-col cols="4">
          <div class="title">Emploi du temps</div>
        </v-col>
        <v-col cols="8" class="mb-0 pb-0">
          <div style="text-align:right;">
            <span class="mr-5">
              <v-btn
                style="margin-right:15px;"
                @click="
                  dark = !dark;
                  $vuetify.theme.dark = dark;
                "
                x-small
                rounded
                fab
              >
                <v-icon>{{
                  dark ? "mdi-brightness-7" : "mdi-brightness-4"
                }}</v-icon>
              </v-btn>
              <v-btn style="margin-right:15px;" @click="today" small rounded>
                Aujourd'hui
              </v-btn>
              <v-btn
                style="margin-right:15px;"
                @click="prevWeek"
                x-small
                rounded
                fab
              >
                <v-icon>mdi-chevron-left</v-icon>
              </v-btn>
              <v-btn
                style="margin-right:15px;"
                @click="nextWeek"
                x-small
                rounded
                fab
              >
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>
            </span>
            <span>
              {{
                moment(date)
                  .startOf("week")
                  .format("YYYY-MM-DD")
              }}
              ~
              {{
                moment(date)
                  .endOf("week")
                  .format("MM-DD")
              }}
            </span>
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-col class="mb-0 pb-0">
          <span class="subtitle-1 mr-5"
            ><v-icon>mdi-filter</v-icon> Filtres</span
          >
          <v-autocomplete
            clearable
            outlined
            rounded
            dense
            v-model="selected.professeur"
            class="inline-block"
            style="display:inline-block;margin-right:5;"
            :items="professeurs"
            :item-value="o => o.CODE"
            :item-text="o => o.NOM + ' ' + o.PRENOM"
            label="Professeurs"
            @change="refresh"
          ></v-autocomplete>
          <v-autocomplete
            clearable
            outlined
            rounded
            dense
            v-model="selected.professeur"
            class="inline-block ml-3"
            style="display:inline-block;margin-right:5;"
            :items="matieres"
            :item-text="o => o.NOM.replace('_', '')"
            label="Matieres"
          ></v-autocomplete>
          <v-autocomplete
            clearable
            outlined
            rounded
            dense
            v-model="selected.professeur"
            class="inline-block ml-3"
            style="display:inline-block;margin-right:5;"
            :items="etudiants"
            :item-text="o => o.NOM + ' ' + o.PRENOM"
            label="Etudiants"
          ></v-autocomplete>
        </v-col>
      </v-row>
      <v-row>
        <v-col sm="12" lg="12">
          <v-card :loading="loading">
            <v-sheet height="600">
              <v-calendar
                ref="calendar"
                v-model="start"
                type="week"
                locale="fr"
                :start="start"
                :end="end"
                :min-weeks="minWeeks"
                :dark="dark"
                :weekdays="weekdays"
                :first-interval="intervals.first"
                :interval-minutes="intervals.minutes"
                :interval-count="intervals.count"
                :interval-height="intervals.height"
                :interval-style="intervalStyle"
                :show-interval-label="showIntervalLabel"
                :short-intervals="false"
                :short-weekdays="true"
                :color="color"
                :events="events"
                :event-overlap-mode="mode"
                :event-overlap-threshold="45"
                :event-color="getEventColor"
              ></v-calendar>
            </v-sheet>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
import moment from "moment";
import _ from "lodash";
const weekdaysDefault = [0, 1, 2, 3, 4, 5, 6];

const intervalsDefault = {
  first: 0,
  minutes: 60,
  count: 24,
  height: 80
};

const stylings = {
  default(interval) {
    return undefined;
  },
  workday(interval) {
    const inactive =
      interval.weekday === 0 ||
      interval.weekday === 6 ||
      interval.hour < 9 ||
      interval.hour >= 17;
    const startOfHour = interval.minute === 0;
    const dark = this.dark;
    const mid = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

    return {
      backgroundColor: inactive
        ? dark
          ? "rgba(0,0,0,0.4)"
          : "rgba(0,0,0,0.05)"
        : undefined,
      borderTop: startOfHour ? undefined : "1px dashed " + mid
    };
  },
  past(interval) {
    return {
      backgroundColor: interval.past
        ? this.dark
          ? "rgba(0,0,0,0.4)"
          : "rgba(0,0,0,0.05)"
        : undefined
    };
  }
};

export default {
  data: () => ({
    loading: false,
    selected: {
      professeur: "",
      etudiant: "",
      matiere: ""
    },
    professeurs: [],
    etudiants: [],
    matieres: [],
    date: " 2013-09-01",
    dark: false,
    startMenu: false,
    endMenu: false,
    minWeeks: 1,
    events: [],
    colors: [
      "blue",
      "indigo",
      "deep-purple",
      "cyan",
      "green",
      "orange",
      "grey darken-1"
    ],
    names: [
      "Meeting",
      "Holiday",
      "PTO",
      "Travel",
      "Event",
      "Birthday",
      "Conference",
      "Party"
    ],
    type: "month",
    typeOptions: [
      { text: "Day", value: "day" },
      { text: "4 Day", value: "4day" },
      { text: "Week", value: "week" },
      { text: "Month", value: "month" },
      { text: "Custom Daily", value: "custom-daily" },
      { text: "Custom Weekly", value: "custom-weekly" }
    ],
    mode: "stack",
    modeOptions: [
      { text: "Stack", value: "stack" },
      { text: "Column", value: "column" }
    ],
    weekdays: weekdaysDefault,
    weekdaysOptions: [
      { text: "Sunday - Saturday", value: weekdaysDefault },
      { text: "Mon, Wed, Fri", value: [1, 3, 5] },
      { text: "Mon - Fri", value: [1, 2, 3, 4, 5] },
      { text: "Mon - Sun", value: [1, 2, 3, 4, 5, 6, 0] }
    ],
    intervals: intervalsDefault,
    intervalsOptions: [
      { text: "Default", value: intervalsDefault },
      {
        text: "Workday",
        value: { first: 16, minutes: 30, count: 20, height: 48 }
      }
    ],
    styleInterval: "default",
    color: "primary",
    shortIntervals: true,
    shortMonths: false,
    shortWeekdays: false
  }),
  computed: {
    start() {
      return moment(this.date)
        .startOf("week")
        .format("YYYY-MM-DD");
    },
    end() {
      return moment(this.date)
        .endOf("week")
        .format("YYYY-MM-DD");
    },
    intervalStyle() {
      return stylings[this.styleInterval].bind(this);
    },
    hasIntervals() {
      return (
        this.type in
        {
          week: 1,
          day: 1,
          "4day": 1,
          "custom-daily": 1
        }
      );
    },
    hasEnd() {
      return (
        this.type in
        {
          "custom-weekly": 1,
          "custom-daily": 1
        }
      );
    }
  },
  methods: {
    refresh() {
      this.$nextTick(() => {
        this.getEvents();
      });
    },
    today() {
      this.date = moment().format("YYYY-MM-DD");
      this.refresh();
    },
    nextWeek() {
      this.date = moment(this.date)
        .add(1, "weeks")
        .format("YYYY-MM-DD");
      this.refresh();
    },
    prevWeek() {
      this.date = moment(this.date)
        .subtract(1, "weeks")
        .format("YYYY-MM-DD");
      this.refresh();
    },
    getEtudiants() {
      this.axios.get("/etudiants").then(r => {
        this.etudiants = r.data;
      });
    },
    getMatieres() {
      this.axios.get("/matieres").then(r => {
        this.matieres = r.data;
      });
    },
    getProfs() {
      this.axios.get("/profs").then(r => {
        this.professeurs = r.data;
      });
    },
    moment: moment,
    viewDay({ date }) {
      this.start = date;
      this.type = "day";
    },
    getEventColor(event) {
      return event.color;
    },
    showIntervalLabel(interval) {
      return interval.minute === 0;
    },
    getEvents() {
      let $ = this;
      $.loading = true;
      $.axios
        .post("/", {
          date: {
            start: $.start,
            end: $.end
          },
          professeur: $.selected.professeur
        })
        .then(d => {
          let temp = [];
          d.data.map((o, i) => {
            let time_start = moment(o.DATE + " " + o.HEURE, "YYYY-M-D Hmm");
            let dur = (o.DUREE + "").length <= 3 ? "0" + o.DUREE : o.DUREE;
            let duration = moment.duration({
              hours: _.toInteger(dur.substr(0, 2)),
              minutes: _.toInteger(dur.substr(2, 2))
            });
            let time_end = moment(time_start.format("YYYY-MM-DD HH:mm")).add(
              duration
            );
            let name = [];
            if (o.SALLES) name.push("Salle " + o.SALLES.NOM);
            if (o.GROUPES) name.push("Groupe " + o.GROUPES.NOM);
            if (o.LES_PROFESSEURS)
              name.push(
                "PROF " + o.LES_PROFESSEURS.NOM + " " + o.LES_PROFESSEURS.PRENOM
              );
            temp.push({
              name: _.join(name, " - "),
              start: time_start.format("YYYY-MM-DD HH:mm"),
              end: time_end.format("YYYY-MM-DD HH:mm"),
              color: $.colors[0]
            });
          });
          $.events = temp;
          $.loading = false;
        });
    },
    rnd(a, b) {
      return Math.floor((b - a + 1) * Math.random()) + a;
    },
    formatDate(a, withTime) {
      return withTime
        ? `${a.getFullYear()}-${a.getMonth() +
            1}-${a.getDate()} ${a.getHours()}:${a.getMinutes()}`
        : `${a.getFullYear()}-${a.getMonth() + 1}-${a.getDate()}`;
    }
  },
  mounted() {
    this.getProfs();
    this.getMatieres();
    this.getEtudiants();
    this.getEvents();
  }
};
</script>

<style>
.controls {
  position: relative;
}
#cal,
body,
html,
#app {
  font-family: Helvetica, Arial, sans-serif;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
}
.v-calendar .v-event-timed-container .v-event-timed {
  white-space: normal !important;
}
</style>
