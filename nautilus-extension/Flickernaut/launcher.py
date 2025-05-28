import os
import shlex
from gi.repository import GLib, Gio, Gdk  # type: ignore
from .logger import get_logger

logger = get_logger(__name__)


class Launcher:
    """Handles launching a desktop application."""

    def __init__(self, app_info: Gio.DesktopAppInfo, app_id: str, name: str) -> None:
        self.app_id = app_id
        self.name = name
        self._app_info = app_info
        self._commandline = self._get_commandline(app_info)

    def _get_commandline(self, app_info: Gio.DesktopAppInfo) -> list[str]:
        """Get the commandline from the app_info, handling special cases."""
        executable = os.path.basename(app_info.get_executable()) or ""

        # For AppImage, skip bin_path check and use commandline as-is
        is_appimage = executable.endswith(".appimage")
        bin_path = GLib.find_program_in_path(executable)
        cmd = app_info.get_commandline() or ""

        # Split commandline into tokens while respecting quotes
        tokens = shlex.split(cmd)

        # fmt: off
        # Placeholder tokens
        placeholders = {
            "%f", "%F", "%u", "%U", "%d", "%D", "%n", "%N", "%k", "%v", "%m", "%i", "%c", "%r", "@@u", "@@", "@",
        }
        # fmt: on

        filtered = [
            t for t in tokens if t not in placeholders and not t.startswith("%")
        ]

        if not is_appimage and bin_path and filtered:
            filtered[0] = bin_path

        logger.debug(f"commandline: {filtered}")

        return filtered

    def launch(self, paths: list[str]) -> bool:
        """Launch the application using Gio or fallback to commandline if necessary."""

        if not self._app_info:
            logger.error(f"No app info available for {self.app_id}")
            return False

        # Launch app using Gio like how nautilus does, or fallback to commandline if necessary
        try:
            gfiles = [Gio.File.new_for_uri(path) for path in paths]
            paths_is_local = [gfile.is_native() for gfile in gfiles]
            all_local = all(paths_is_local)
            local_paths = [gfile.get_path() for gfile in gfiles]

            try:
                display = Gdk.Display.get_default()
                launch_context = display.get_app_launch_context() if display else None

                if all_local:
                    logger.debug(
                        f"Launching {self.name} {' '.join([p for p in local_paths if p])}"
                    )
                    success = self._app_info.launch(gfiles, launch_context)
                else:
                    logger.debug(
                        f"Launching {self.name} {' '.join([p for p in paths if p])}"
                    )
                    success = self._app_info.launch_uris(paths, launch_context)

                if success:
                    return True

            except Exception as e:
                logger.warning(f"Gio launch failed: {e}")
                logger.debug("Falling back to commandline...")

            if self._commandline:
                try:
                    command = list(self._commandline)
                    if all_local:
                        command.extend(local_paths)
                    else:
                        command.extend(paths)
                    logger.debug(f"Launching {self.name}: {' '.join(command)}")
                    pid, *_ = GLib.spawn_async(command)
                    GLib.spawn_close_pid(pid)
                    return True

                except Exception as e:
                    logger.error(f"Commandline launch failed: {e}")

            logger.error(f"All launch methods failed for {self.app_id}")
            return False

        except Exception as e:
            logger.error(f"Unexpected error during launch: {e}")
            return False
