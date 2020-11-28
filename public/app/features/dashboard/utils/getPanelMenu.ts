import { updateLocation } from 'app/core/actions';
import { store } from 'app/store/store';
import { AngularComponent, getDataSourceSrv, getLocationSrv } from '@grafana/runtime';
import { PanelMenuItem } from '@grafana/data';
import { copyPanel, duplicatePanel, removePanel, sharePanel } from 'app/features/dashboard/utils/panel';
import { PanelModel } from 'app/features/dashboard/state/PanelModel';
import { DashboardModel } from 'app/features/dashboard/state/DashboardModel';
import { contextSrv } from '../../../core/services/context_srv';
import { navigateToExplore } from '../../explore/state/actions';
import { getExploreUrl } from '../../../core/utils/explore';
import { getTimeSrv } from '../services/TimeSrv';
import { PanelCtrl } from '../../panel/panel_ctrl';
import i18n from 'app/core/i18n/i18n';

export function getPanelMenu(
  dashboard: DashboardModel,
  panel: PanelModel,
  angularComponent?: AngularComponent | null
): PanelMenuItem[] {
  const onViewPanel = (event: React.MouseEvent<any>) => {
    event.preventDefault();
    store.dispatch(
      updateLocation({
        query: {
          viewPanel: panel.id,
        },
        partial: true,
      })
    );
  };

  const onEditPanel = (event: React.MouseEvent<any>) => {
    event.preventDefault();
    store.dispatch(
      updateLocation({
        query: {
          editPanel: panel.id,
        },
        partial: true,
      })
    );
  };

  const onSharePanel = (event: React.MouseEvent<any>) => {
    event.preventDefault();
    sharePanel(dashboard, panel);
  };

  const onInspectPanel = (tab?: string) => {
    getLocationSrv().update({
      partial: true,
      query: {
        inspect: panel.id,
        inspectTab: tab,
      },
    });
  };

  const onMore = (event: React.MouseEvent<any>) => {
    event.preventDefault();
  };

  const onDuplicatePanel = (event: React.MouseEvent<any>) => {
    event.preventDefault();
    duplicatePanel(dashboard, panel);
  };

  const onCopyPanel = (event: React.MouseEvent<any>) => {
    event.preventDefault();
    copyPanel(panel);
  };

  const onRemovePanel = (event: React.MouseEvent<any>) => {
    event.preventDefault();
    removePanel(dashboard, panel, true);
  };

  const onNavigateToExplore = (event: React.MouseEvent<any>) => {
    event.preventDefault();
    const openInNewWindow = event.ctrlKey || event.metaKey ? (url: string) => window.open(url) : undefined;
    store.dispatch(navigateToExplore(panel, { getDataSourceSrv, getTimeSrv, getExploreUrl, openInNewWindow }) as any);
  };

  const menu: PanelMenuItem[] = [];

  if (!panel.isEditing) {
    menu.push({
      text: i18n.t('View'),
      iconClassName: 'eye',
      onClick: onViewPanel,
      shortcut: 'v',
    });
  }

  if (dashboard.canEditPanel(panel) && !panel.isEditing) {
    menu.push({
      text: i18n.t('Edit'),
      iconClassName: 'edit',
      onClick: onEditPanel,
      shortcut: 'e',
    });
  }

  menu.push({
    text: i18n.t('Share'),
    iconClassName: 'share-alt',
    onClick: onSharePanel,
    shortcut: 'p s',
  });

  if (contextSrv.hasAccessToExplore() && !(panel.plugin && panel.plugin.meta.skipDataQuery)) {
    menu.push({
      text: i18n.t('Explore'),
      iconClassName: 'compass',
      shortcut: 'x',
      onClick: onNavigateToExplore,
    });
  }

  const inspectMenu: PanelMenuItem[] = [];

  // Only show these inspect actions for data plugins
  if (panel.plugin && !panel.plugin.meta.skipDataQuery) {
    inspectMenu.push({
      text: i18n.t('Data'),
      onClick: (e: React.MouseEvent<any>) => onInspectPanel('data'),
    });

    if (dashboard.meta.canEdit) {
      inspectMenu.push({
        text: i18n.t('Query'),
        onClick: (e: React.MouseEvent<any>) => onInspectPanel('query'),
      });
    }
  }

  inspectMenu.push({
    text: i18n.t('Panel JSON'),
    onClick: (e: React.MouseEvent<any>) => onInspectPanel('json'),
  });

  menu.push({
    type: 'submenu',
    text: i18n.t('Inspect'),
    iconClassName: 'info-circle',
    onClick: (e: React.MouseEvent<any>) => onInspectPanel(),
    shortcut: 'i',
    subMenu: inspectMenu,
  });

  const subMenu: PanelMenuItem[] = [];

  if (dashboard.canEditPanel(panel) && !(panel.isViewing || panel.isEditing)) {
    subMenu.push({
      text: i18n.t('Duplicate'),
      onClick: onDuplicatePanel,
      shortcut: 'p d',
    });

    subMenu.push({
      text: i18n.t('Copy'),
      onClick: onCopyPanel,
    });
  }

  // add old angular panel options
  if (angularComponent) {
    const scope = angularComponent.getScope();
    const panelCtrl: PanelCtrl = scope.$$childHead.ctrl;
    const angularMenuItems = panelCtrl.getExtendedMenu();

    for (const item of angularMenuItems) {
      const reactItem: PanelMenuItem = {
        text: item.text,
        href: item.href,
        shortcut: item.shortcut,
      };

      if (item.click) {
        reactItem.onClick = () => {
          scope.$eval(item.click, { ctrl: panelCtrl });
        };
      }

      subMenu.push(reactItem);
    }
  }

  if (!panel.isEditing && subMenu.length) {
    menu.push({
      type: 'submenu',
      text: i18n.t('More...'),
      iconClassName: 'cube',
      subMenu,
      onClick: onMore,
    });
  }

  if (dashboard.canEditPanel(panel) && !panel.isEditing) {
    menu.push({ type: 'divider', text: '' });

    menu.push({
      text: i18n.t('Remove'),
      iconClassName: 'trash-alt',
      onClick: onRemovePanel,
      shortcut: 'p r',
    });
  }

  return menu;
}
