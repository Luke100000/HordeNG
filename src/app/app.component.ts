import {Component, Inject, OnInit, PLATFORM_ID, signal, ViewContainerRef} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {TopMenuComponent} from "./components/top-menu/top-menu.component";
import {AiHorde} from "./services/ai-horde.service";
import {AuthManagerService} from "./services/auth-manager.service";
import {toPromise} from "./helper/resolvable";
import {globalAppView} from "./global-app-view";
import {SwUpdate} from "@angular/service-worker";
import {ToastrService} from "ngx-toastr";
import {TranslatorService} from "./services/translator.service";
import {FooterComponent} from "./components/footer/footer.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TopMenuComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private updateChecked = signal(false);

  constructor(
    private readonly aiHorde: AiHorde,
    private readonly authManager: AuthManagerService,
    private readonly updates: SwUpdate,
    private readonly toastr: ToastrService,
    private readonly translator: TranslatorService,
    @Inject(PLATFORM_ID)
    private readonly platform: string,
    view: ViewContainerRef,
  ) {
    globalAppView.set(view);
  }

  public async ngOnInit(): Promise<void> {
    if (this.updates.isEnabled) {
      this.updates.versionUpdates.subscribe(async event => {
        if (this.updateChecked()) {
          return;
        }
        if (event.type === 'VERSION_READY') {
          const toast = this.toastr.info(
            await toPromise(this.translator.get('app.new_version.available')),
            await toPromise(this.translator.get('app.new_version.title')),
            {
              closeButton: true,
              disableTimeOut: true,
              tapToDismiss: false,
            }
          );
          toast.onTap.subscribe(() => {
            window.location.reload();
          });
        }
      });

      await this.updates.checkForUpdate();
      this.updateChecked.set(true);
    }

    if (this.authManager.apiKey() !== this.authManager.anonymousApiKey) {
      const user = await toPromise(this.aiHorde.currentUser());
      if (!user.success) {
        this.authManager.apiKey = this.authManager.anonymousApiKey;
      }
    }
  }
}
