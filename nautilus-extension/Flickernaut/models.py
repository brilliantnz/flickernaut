"""
nautilus-flickernaut.py - Nautilus extension providing IDE/editor or other apps context menu integration.

A great deal of credit and appreciation is owed to the nautilus-code developers.

https://github.com/realmazharhussain/nautilus-code/blob/main/NautilusCode/types.py
"""

import os
from gettext import gettext as _
from typing import Optional, TypedDict
from gi.repository import GLib, Gio  # type: ignore
from .logger import get_logger
from .launcher import Launcher

logger = get_logger(__name__)


class AppJsonStruct(TypedDict):
    id: str
    app_id: str
    name: str
    pinned: bool
    multiple_files: bool
    multiple_folders: bool
    package_type: str
    installed: bool
    enable: bool


class Application:
    """Represents an application entry configured in Flickernaut."""

    def __init__(
        self,
        id: str,
        app_id: str,
        name: str,
        pinned: bool = False,
        multiple_files: bool = False,
        multiple_folders: bool = False,
        package_type: str = "",
        installed: bool = False,
    ) -> None:
        self.id: str = id
        self.app_id: str = app_id
        self.name: str = name
        self.pinned: bool = pinned
        self.multiple_files: bool = multiple_files
        self.multiple_folders: bool = multiple_folders
        self.package_type: str = package_type
        self.installed: bool = installed
        self.launcher: Optional[Launcher] = None
        if self.installed:
            app_info = Gio.DesktopAppInfo.new(app_id) if app_id else None
            try:
                self.launcher = Launcher(app_info, app_id, name) if app_info else None
            except Exception as e:
                logger.error(f"Failed to initialize launcher for {app_id}: {e}")
