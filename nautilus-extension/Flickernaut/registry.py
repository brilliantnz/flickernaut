from gettext import gettext as _
from gi.repository import Nautilus, GLib  # type: ignore
from .logger import get_logger
from .launcher import Launcher
from .models import Application

logger = get_logger(__name__)


class ApplicationsRegistry(dict[str, Application]):
    """Registry for configured applications with menu caching and filtering."""

    def __init__(self):
        super().__init__()
        self._menu_cache: dict = {}

    def add_application(self, application: Application) -> None:
        """Register a new Application."""
        self[application.id] = application

    def get_menu_items(
        self,
        paths: list[str],
        *,
        id_prefix: str = "",
        is_file: bool = False,
        selection_count: int = 1,
        use_submenu: bool = False,
    ) -> list[Nautilus.MenuItem]:
        """Generate Nautilus menu items for given paths and context."""
        cache_key = (
            tuple(paths),
            id_prefix,
            is_file,
            selection_count,
            use_submenu,
        )

        if cache_key in self._menu_cache:
            return self._menu_cache[cache_key]

        menu_items: list[Nautilus.MenuItem] = []
        pinned_items: list[Nautilus.MenuItem] = []
        submenu_items: list[Nautilus.MenuItem] = []

        for app in self._filter_applications(
            is_file=is_file, selection_count=selection_count
        ):
            if not app.launcher:
                continue
            item = self._create_menu_item(app, app.launcher, paths, id_prefix, is_file)
            if use_submenu:
                if app.pinned:
                    pinned_items.append(item)
                else:
                    submenu_items.append(item)
            else:
                menu_items.append(item)

        if use_submenu:
            sub_items = self._build_submenu(
                submenu_items, pinned_items, id_prefix, is_file
            )

            if not sub_items:
                logger.warning(
                    f"No menu items produced for paths: {paths!r} (is_file={is_file})"
                )

            self._menu_cache[cache_key] = sub_items
            return sub_items

        if not menu_items:
            logger.warning(
                f"No menu items produced for paths: {paths!r} (is_file={is_file})"
            )

        self._menu_cache[cache_key] = menu_items
        return menu_items

    def _build_submenu(
        self,
        submenu_items: list[Nautilus.MenuItem],
        pinned_items: list[Nautilus.MenuItem],
        id_prefix: str,
        is_file: bool,
    ) -> list[Nautilus.MenuItem]:
        """Build submenu for Nautilus context menu."""
        sub_items = []
        if submenu_items:
            submenu = Nautilus.Menu()
            for item in submenu_items:
                submenu.append_item(item)
            label = _("Open In...") if not is_file else _("Open With...")
            submenu_item = Nautilus.MenuItem.new(
                f"Flickernaut::submenu::{id_prefix}", label
            )
            submenu_item.set_submenu(submenu)
            sub_items.append(submenu_item)
        sub_items.extend(pinned_items)
        return sub_items

    def _filter_applications(
        self,
        *,
        is_file: bool,
        selection_count: int = 1,
    ) -> list[Application]:
        """Filter applications by context and installation status."""
        filtered: list[Application] = []
        for app in self.values():
            if not app.installed:
                continue
            if selection_count > 1:
                # Multi-select: filter by support for multiple files/folders
                if is_file and not app.multiple_files:
                    continue
                if not is_file and not app.multiple_folders:
                    continue
            # For single selection, always show if installed
            filtered.append(app)
        return filtered

    def _create_menu_item(
        self,
        application: Application,
        launcher: Launcher,
        paths: list[str],
        id_prefix: str,
        is_file: bool,
    ) -> Nautilus.MenuItem:
        """Create a Nautilus.MenuItem for an application and launcher."""
        label = (
            _("Open with %s") % application.name
            if is_file
            else _("Open in %s") % application.name
        )
        item = Nautilus.MenuItem.new(
            name=f"Flickernaut::{id_prefix}::{application.id}",
            label=label,
        )
        item.connect("activate", self._activate_menu_item, launcher, paths)
        return item

    @staticmethod
    def _activate_menu_item(
        item: Nautilus.MenuItem, launcher: Launcher, paths: list[str]
    ) -> None:
        """Callback to activate a menu item and launch the command."""
        try:
            if not launcher:
                logger.error("No valid launcher provided for menu item activation.")
                return
            if not paths:
                logger.error("No paths provided for launcher.")
                return
            if launcher.launch(paths):
                logger.debug(f"Launch succeeded for {launcher.name}")
                return
        except Exception as e:
            logger.error(f"Error during launching application: {e}")
