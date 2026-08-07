import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import localeFr from '@angular/common/locales/fr';
import { registerLocaleData } from '@angular/common';


registerLocaleData(localeFr);
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
