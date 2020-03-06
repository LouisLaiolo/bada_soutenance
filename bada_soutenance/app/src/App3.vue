<template>
  <v-app>
    <v-container fluid>
      <v-row>
        <v-col>
          <v-card>
            <v-card-title>
              <v-container fluid>
                <v-row>
                  <v-col cols="4">
                    Emploi de temps
                  </v-col>
                  <v-col cols="8">
                    <div style="text-align:right;">
                      <span class="mr-5">
                        <v-btn
                          style="margin-right:15px;"
                          @click="today"
                          small
                          rounded
                        >
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
                  <v-col>
                    <span class="subtitle-1 mr-5"
                      ><v-icon>mdi-filter</v-icon> Filtres</span
                    >
                    <v-autocomplete
                      outlined
                      rounded
                      dense
                      v-model="selected.professor"
                      class="inline-block"
                      style="display:inline-block;margin-right:5;"
                      :items="professors"
                      :item-text="o => o.NOM + ' ' + o.PRENOM"
                      label="Professeurs"
                    ></v-autocomplete>
                    <v-autocomplete
                      outlined
                      rounded
                      dense
                      v-model="selected.professor"
                      class="inline-block ml-3"
                      style="display:inline-block;margin-right:5;"
                      :items="matieres"
                      :item-text="o => o.NOM.replace('_', '')"
                      label="Matieres"
                    ></v-autocomplete>
                    <v-autocomplete
                      outlined
                      rounded
                      dense
                      v-model="selected.professor"
                      class="inline-block ml-3"
                      style="display:inline-block;margin-right:5;"
                      :items="etudiants"
                      :item-text="o => o.NOM + ' ' + o.PRENOM"
                      label="Etudiants"
                    ></v-autocomplete>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-title>
            <v-card-text>
              <calendar
                :calendars="calendarList"
                :schedules="scheduleList"
                :view="view"
                :taskView="taskView"
                :scheduleView="scheduleView"
                :theme="theme"
                :week="week"
                :timezones="timezones"
                :disableDblClick="disableDblClick"
                :isReadOnly="isReadOnly"
                :template="template"
                :useCreationPopup="useCreationPopup"
                :useDetailPopup="useDetailPopup"
                id="cal"
                ref="tuiCalendar"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
import _ from "lodash";
import moment from "moment";
import "tui-calendar/dist/tui-calendar.css";
import { Calendar } from "@toast-ui/vue-calendar";

export default {
  name: "myCalendar",
  components: {
    calendar: Calendar
  },
  mounted() {
    this.get();
    this.setDate(new Date(this.date));
    this.getProfs();
    this.getMatieres();
    this.getEtudiants();
  },
  methods: {
    moment: moment,
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
        this.professors = r.data;
      });
    },
    today() {
      this.date = moment().format("YYYY-MM-DD");
      this.rend();
    },
    nextWeek() {
      this.date = moment(this.date)
        .add(1, "weeks")
        .format("YYYY-MM-DD");
      this.rend();
    },
    prevWeek() {
      this.date = moment(this.date)
        .subtract(1, "weeks")
        .format("YYYY-MM-DD");
      this.rend();
    },
    setDate(date) {
      this.$refs.tuiCalendar.invoke("setDate", date);
    },
    rend() {
      this.$refs.tuiCalendar.invoke("render");
    },
    get() {
      this.$axios.get("/").then(r => {
        let $ = this;
        _.map(r.data, (o, i) => {
          let time_start = moment(o.DATE + " " + o.HEURE, "YYYY-M-D Hmm");
          let dur = o.DUREE.length <= 3 ? "0" + o.DUREE : o.DUREE;
          let duration = moment.duration({
            hours: _.toInteger(dur.substr(0, 2)),
            minutes: _.toInteger(dur.substr(2, 2))
          });
          let time_end = moment(time_start.format("YYYY-MM-DD HH:mm")).add(
            duration
          );
          $.scheduleList.push({
            id: i,
            calendarId: "0",
            title: `My schedule ${i}`,
            category: "time",
            dueDateClass: "",
            start: time_start.format("YYYY-MM-DDTHH:mm"),
            end: time_end.format("YYYY-MM-DDTHH:mm")
          });
        });
        this.rend();
      });
    }
  },
  data() {
    return {
      selected: {
        professor: ""
      },
      professors: [],
      etudiants: [],
      matieres: [],
      date: "2020-03-31",
      calendarList: [
        {
          id: "0",
          name: "Emploi de temps"
        }
      ],
      scheduleList: [],
      view: "week",
      taskView: false,
      scheduleView: ["time"],
      theme: {
        "month.dayname.height": "30px",
        "month.dayname.borderLeft": "1px solid #ff0000",
        "month.dayname.textAlign": "center",
        "week.today.color": "#333",
        "week.daygridLeft.width": "100px",
        "week.timegridLeft.width": "100px"
      },
      week: {
        startDayOfWeek: 1,
        daynames: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
        narrowWeekend: true
      },
      timezones: [
        {
          timezoneOffset: 60,
          displayLabel: "UTC +1",
          tooltip: "France"
        }
      ],
      disableDblClick: true,
      isReadOnly: true,
      template: {},
      useCreationPopup: true,
      useDetailPopup: false
    };
  }
};
</script>

<style>
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
</style>
