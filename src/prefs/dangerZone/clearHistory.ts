import Adw from '@girs/adw-1';
import Gio from '@girs/gio-2.0';
import Gtk4 from '@girs/gtk-4.0';
import type { ExtensionBase } from '@pano/types/extension/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { deleteAppDirs, gettext, logger } from '@pano/utils/shell';

const debug = logger('prefs:dangerZone:clearHistory');
@registerGObjectClass
export class ClearHistoryRow extends Adw.ActionRow {
  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Clear History'),
      subtitle: _('Clears the clipboard database and cache'),
    });

    const clearHistoryButton = new Gtk4.Button({
      css_classes: ['destructive-action'],
      label: _('Clear'),
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });
    clearHistoryButton.connect('clicked', () => {
      const md = new Gtk4.MessageDialog({
        text: _('Are you sure you want to clear history?'),
        transient_for: this.get_root() as Adw.Window,
        destroy_with_parent: true,
        modal: true,
        visible: true,
        buttons: Gtk4.ButtonsType.OK_CANCEL,
      });
      md.get_widget_for_response(Gtk4.ResponseType.OK)?.add_css_class('destructive-action');
      md.connect('response', async (_, response) => {
        if (response === Gtk4.ResponseType.OK) {
          let isDbusRunning = true;
          try {
            Gio.DBus.session.call_sync(
              'org.gnome.Shell',
              '/io/elhan/Pano',
              'io.elhan.Pano',
              'stop',
              null,
              null,
              Gio.DBusCallFlags.NONE,
              -1,
              null,
            );
          } catch (err) {
            isDbusRunning = false;
            debug('Extension is not enabled. Clearing db file without stopping the extension.');
          }
          await deleteAppDirs(ext);
          if (isDbusRunning) {
            Gio.DBus.session.call_sync(
              'org.gnome.Shell',
              '/io/elhan/Pano',
              'io.elhan.Pano',
              'start',
              null,
              null,
              Gio.DBusCallFlags.NONE,
              -1,
              null,
            );
          }
        }

        md.destroy();
      });
    });

    this.add_suffix(clearHistoryButton);
  }
}
