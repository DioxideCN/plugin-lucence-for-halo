<template>
    <section :data-theme="LucenceCore.cache.value.theme"
             class="lucence-wrapper">
        <!-- Lucence Editor Loader -->
        <div id="lucence-loader"
             class="unselectable"
             :class="(LucenceCore.cache.value.plugin.loaded && LucenceCore.cache.value.components.loaded) ? 'loaded' : ''">
            <div class="fa-fade"><i class="fa-solid fa-gear fa-spin" style="margin-right: 8px;"></i>正在初始化...</div>
        </div>
        <!-- Lucence Editor -->
        <div id="toast-editor"></div>
        <!-- Lucence Bottom Bar Module -->
        <div class="toolbar-stat-panel unselectable">
            <div @click="openExtension()" class="stat-head">
                <i class="codicon codicon-extensions"></i>
            </div>
            <div class="stat-panel">
                <div class="stat-panel--left">
                    <span class="stat-panel--key">
                        <i class="codicon codicon-settings-gear"></i>
                        设置
                    </span>
                    <span class="stat-panel--key" @click="core.toggle.search()">
                        <i class="codicon codicon-search"></i>
                        查找
                    </span>
                    <span class="stat-panel--key" @click="core.toggle.autoSave()">
                        <i class="codicon codicon-save"></i>
                        {{ LucenceCore.cache.value.feature.autoSave ? '自动' : '手动' }}保存
                    </span>
                </div>
                <div class="stat-panel--right">
                    <span class="stat-panel--key">
                        行 {{ LucenceCore.cache.value.feature.focus.row }}，列 {{ LucenceCore.cache.value.feature.focus.col }}{{ LucenceCore.cache.value.feature.count.selected ? ` (已选择${LucenceCore.cache.value.feature.count.selected})` : '' }}
                    </span>
                    <span class="stat-panel--key">
                        字词 {{ LucenceCore.cache.value.feature.count.words }}，字符 {{ LucenceCore.cache.value.feature.count.characters }}
                    </span>
                    <span class="stat-panel--key">
                        <i class="codicon codicon-bracket-dot"></i>
                        Markdown
                    </span>
                    <span class="stat-panel--key" @click="core.toggle.preview()">
                        <i class="codicon" 
                           style="margin-right: 0;"
                           :class="LucenceCore.cache.value.feature.preview ? 'codicon-eye' : 'codicon-eye-closed'">
                        </i>
                    </span>
                    <span class="stat-panel--key last" @click="LucenceCore.switchOpenNotificationCenter()">
                        <i v-if="LucenceCore.notifyMode.value === 'notify'" 
                           class="codicon" 
                           :class="LucenceCore.notifications.value.size !== 0 ? 
                                'codicon-bell-dot fa-shake' : 'codicon-bell'">
                        </i>
                        <i v-else
                           class="codicon"
                           :class="LucenceCore.notifications.value.size !== 0 ? 
                                'codicon-bell-slash-dot' : 'codicon-bell-slash'">
                        </i>
                    </span>
                </div>
            </div>
        </div>
        <!-- Amber Search Engine -->
        <div id="amber-popup--group" 
             class="amber-popup">
            <div class="amber-popup--search" 
                 :style="'display:' + (LucenceCore.cache.value.feature.search.enable ? 'flex' : 'none')">
                <div class="amber-popup--width_expander"></div>
                <div class="amber-popup--expander amber-popup--padding"
                     @click="core.toggle.replacing()">
                    <i class="codicon" 
                       :class="LucenceCore.cache.value.feature.search.replace ? 'codicon-chevron-down' : 'codicon-chevron-right'"></i>
                </div>
                <div class="amber-popup--padding">
                    <div class="amber-popup--ahead">
                        <div class="amber-popup--group">
                            <input @input="core.doSearch()" 
                                   id="amber-search--input" 
                                   type="text" 
                                   placeholder="查找" />
                            <i @click="core.toggle.capitalization()"
                               :class="LucenceCore.cache.value.feature.search.condition.capitalization ? 'active' : ''" 
                               class="codicon codicon-case-sensitive amber-popup--capitalization"
                               title="区分大小写">
                            </i>
                            <i @click="core.toggle.regular()" 
                               :class="LucenceCore.cache.value.feature.search.condition.regular ? 'active' : ''" 
                               class="codicon codicon-regex amber-popup--regular"
                               title="使用正则表达式">
                            </i>
                        </div>
                        <span class="amber-popup--result unselectable">
                            {{ LucenceCore.cache.value.feature.search.result.total === 0 ? '无结果' : ('第 ' + LucenceCore.cache.value.feature.search.result.hoverOn + ' 项, 共 ' + LucenceCore.cache.value.feature.search.result.total) + ' 项' }}
                        </span>
                        <div class="amber-popup--btn">
                            <i class="fa-solid fa-arrow-up amber-popup--last" 
                               :class="LucenceCore.cache.value.feature.search.result.total === 0 ? 'disable' : ''" 
                               @click="core.locateSearchResultAt(false)"
                               title="上一个匹配项">
                            </i>
                            <i class="fa-solid fa-arrow-down amber-popup--next" 
                               :class="LucenceCore.cache.value.feature.search.result.total === 0 ? 'disable' : ''" 
                               @click="core.locateSearchResultAt(true)"
                               title="下一个匹配项">
                            </i>
                            <i class="fa-solid fa-xmark amber-popup--close" 
                               @click="core.toggle.search()"
                               title="关闭">
                            </i>
                        </div>
                    </div>
                    <div class="amber-popup--ahead amber-popup--replace" 
                         :style="'display:' + (LucenceCore.cache.value.feature.search.replace ? '' : 'none')">
                        <div class="amber-popup--group">
                            <input id="amber-search--replacing"
                                   type="text"
                                   placeholder="替换" />
                            <i @click="core.toggle.keepCap()"
                               class="codicon codicon-preserve-case amber-popup--capitalization"
                               :class="LucenceCore.cache.value.feature.search.condition.keepCap ? 'active' : ''"
                               title="保留大小写">
                            </i>
                        </div>
                        <!-- when there is no result we disable these btn -->
                        <i @click="core.doReplacing(false)"
                           class="codicon codicon-replace amber-popup--regular"
                           :class="LucenceCore.cache.value.feature.search.result.total === 0 ? 'disable' : ''"
                           title="替换">
                        </i>
                        <i @click="core.doReplacing(true)"
                           class="codicon codicon-replace-all amber-popup--regular"
                           :class="LucenceCore.cache.value.feature.search.result.total === 0 ? 'disable' : ''"
                           title="全部替换">
                        </i>
                    </div>
                </div>
            </div>
        </div>
        <!-- Lucence Extension Module -->
        <div id="lucence-plugin--store"
             @click="closeExtension()"
             v-if="LucenceCore.cache.value.plugin.loaded"
             :style="`display:${LucenceCore.cache.value.plugin.enable ? 'flex' : 'none'}`">
            <div class="lucence-plugin--container"
                 @click.stop>
                <div class="lucence-plugin--head unselectable">
                    <div class="plugin-head--title">Extensions<span>扩展</span></div>
                    <div class="plugin-head--close">
                        <i class="fa-solid fa-xmark closable" 
                           @click="closeExtension()"></i>
                    </div>
                </div>
                <div class="lucence-plugin--body">
                    <div class="lucence-plugin--list">
                        <div class="lucence-plugin--card lucence-plugin--install"
                             id="draggable-install"
                             @click="uploadPlugin()">
                            <template v-if="isUploading">
                                <i class="fa-solid fa-spinner fa-spin"></i>正在安装扩展...
                            </template>
                            <template v-else>
                                <i class="fa-solid fa-plus"></i>拖拽或选择文件安装扩展
                            </template>
                            <input type="file" id="uploadPlugin" @change="handleUploadingPlugin()" style="display: none;">
                        </div>
                        <div class="lucence-plugin--card"
                             v-for="(plugin, index) in core.plugins.value" 
                             :key="'plugin-' + index"
                             @click="switchViewPlugin(index)"
                             :class="pluginStore.activeOn===index?'active':''">
                            <div class="left-column"
                                 :style="plugin.enable ? '' : 'opacity: .5'">
                                <img :alt="plugin.key" 
                                     :src="plugin.detail.icon" 
                                     width="46" 
                                     height="46" />
                            </div>
                            <div class="right-column"
                                 :style="plugin.enable ? '' : 'opacity: .5'">
                                <p class="plugin-info--title">
                                    <span v-if="plugin.external?.source" class="theme-plugin codicon codicon-symbol-color"></span>{{ plugin.detail.name }}
                                </p>
                                <p class="plugin-info--simple">
                                    版本：{{ plugin.detail.version }}&ensp;作者：{{ plugin.detail.author }}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="lucence-plugin--detail">
                        <div class="plugin-detail--head">
                            <p class="plugin-detail--title">
                                <i v-if="core.plugins.value[pluginStore.activeOn].external?.source" class="theme-plugin codicon codicon-symbol-color"></i>{{ core.plugins.value[pluginStore.activeOn].detail.name }}
                                <span>
                                    {{ core.plugins.value[pluginStore.activeOn].detail.version }}
                                </span>
                            </p>
                            <div class="plugin-detail--subject">
                                <span>扩展ID：{{ core.plugins.value[pluginStore.activeOn].key }}</span>
                                <span>作者：{{ core.plugins.value[pluginStore.activeOn].detail.author }}</span>
                                <span v-if="core.plugins.value[pluginStore.activeOn].external?.source">当前主题自带</span>
                                <span>
                                    <a :href="core.plugins.value[pluginStore.activeOn].detail.github"
                                   target="_blank">
                                        <i class="fa-brands fa-github"></i>&nbsp;&nbsp;GitHub
                                    </a>
                                </span>
                            </div>
                            <div v-if="core.plugins.value[pluginStore.activeOn].key !== 'default_extension'" 
                                 class="action-container">
                                <ul class="action-list">
                                    <li v-if="core.plugins.value[pluginStore.activeOn].metadata.version === -1"
                                        class="action-item"
                                        title="安装此主题扩展"
                                        @click="installThemePlugin(core.plugins.value[pluginStore.activeOn])">
                                        <a class="action-label">安装</a>
                                        <div class="action-separator"><div></div></div>
                                        <div class="action-icon">
                                            <i class="fa-solid fa-download"></i>
                                        </div>
                                    </li>
                                    <li @click="disablePlugin(core.plugins.value[pluginStore.activeOn])" 
                                        v-if="core.plugins.value[pluginStore.activeOn].metadata.version !== -1"
                                        class="action-item"
                                        :class="core.plugins.value[pluginStore.activeOn].enable ? '' : 'toEnable'"
                                        :title="core.plugins.value[pluginStore.activeOn].enable ? '禁用扩展' : '启用扩展'">
                                        <a class="action-label">{{ core.plugins.value[pluginStore.activeOn].enable ? '禁用' : '启用' }}</a>
                                        <div class="action-separator"><div></div></div>
                                        <div class="action-icon">
                                            <i v-if="core.plugins.value[pluginStore.activeOn].enable" class="fa-solid fa-ban"></i>
                                            <i v-else class="fa-regular fa-circle-check"></i>
                                        </div>
                                    </li>
                                    <li @click="uninstallPlugin(core.plugins.value[pluginStore.activeOn])"
                                        v-if="core.plugins.value[pluginStore.activeOn].metadata.version !== -1"
                                        class="action-item" 
                                        title="卸载此扩展">
                                        <a class="action-label">卸载</a>
                                        <div class="action-separator"><div></div></div>
                                        <div class="action-icon">
                                            <i class="fa-solid fa-trash-can"></i>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div class="plugin-detail--body">
                            <div class="detail-bar">
                                <ul class="view-bar">
                                    <li class="bar-item" 
                                        :class="pluginStore.actionOn === 0 ? 'active' : ''"
                                        @click="pluginStore.actionOn = 0"
                                        title="查看该扩展的概览">
                                        概览
                                    </li>
                                    <li class="bar-item"
                                        :class="pluginStore.actionOn === 1 ? 'active' : ''"
                                        @click="pluginStore.actionOn = 1"
                                        title="查看该扩展的配置项">
                                        配置项
                                    </li>
                                    <li class="bar-item"
                                        :class="pluginStore.actionOn === 2 ? 'active' : ''"
                                        @click="pluginStore.actionOn = 2"
                                        title="查看该扩展的注册项">
                                        注册项
                                    </li>
                                </ul>
                            </div>
                            <div class="bar-item--detail">
                                <template v-if="pluginStore.actionOn === 0">
                                    {{ core.plugins.value[pluginStore.activeOn].detail.description }}
                                </template>
                                <template v-else-if="pluginStore.actionOn === 1">
                                    插件配置仍处于开发状态，最新状态请关注GitHub
                                </template>
                                <template v-else-if="pluginStore.actionOn === 2">
                                    <ul class="ext-list--body">
                                        <li class="ext-list--column" 
                                            @click="switchActionOpen(0)">
                                            <div class="ext-list--title">
                                                <i class="fa-solid" :class="pluginStore.actionOpen[0]?'fa-caret-down':'fa-caret-right'"></i>工具栏（共{{ core.plugins.value[pluginStore.activeOn].register.toolbar.length }}项）
                                            </div>
                                            <table @click.stop 
                                                   class="ext-list--child_list"
                                                   :style="'display:'+(pluginStore.actionOpen[0]?'':'none')">
                                                <thead>
                                                    <tr>
                                                        <th>ID</th>
                                                        <th>名称</th>
                                                        <th>提示</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="(item, index) in core.plugins.value[pluginStore.activeOn].register.toolbar" :key="index">
                                                        <td><code>{{ item.key }}</code></td>
                                                        <td>{{ item.name }}</td>
                                                        <td>{{ item.tooltip }}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </li>
                                        <li class="ext-list--column"
                                            @click="switchActionOpen(1)">
                                            <div class="ext-list--title">
                                                <i class="fa-solid" :class="pluginStore.actionOpen[1]?'fa-caret-down':'fa-caret-right'"></i>渲染器（共{{ core.plugins.value[pluginStore.activeOn].register.renderers.length }}项）
                                            </div>
                                            <table @click.stop
                                                   class="ext-list--child_list"
                                                   :style="'display:'+(pluginStore.actionOpen[1]?'':'none')">
                                                <thead>
                                                    <tr>
                                                        <th>ID</th>
                                                        <th>描述</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                <template 
                                                    v-for="(renderer, index) in core.plugins.value[pluginStore.activeOn].register.renderers" 
                                                    :key="index">
                                                    <tr>
                                                        <td><code>{{ renderer.key }}</code></td>
                                                        <td>{{ renderer.desc }}</td>
                                                    </tr>
                                                    <tr class="secondary-table">
                                                        <td class="secondary-table--td" colspan="2">
                                                            <table>
                                                                <thead>
                                                                    <tr>
                                                                        <th>组件</th>
                                                                        <th>描述</th>
                                                                        <th>在组件库中</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    <tr v-for="(key, idx) in Object.keys(renderer.components)" :key="'component-' + renderer.key + '-' + idx">
                                                                        <td><code>{{ key }}</code></td>
                                                                        <td>{{ renderer.components[key].desc }}</td>
                                                                        <td>{{ renderer.components[key].showInComponents === false ? '×' : '√' }}︎</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </template>
                                                </tbody>
                                            </table>
                                        </li>
                                        <li class="ext-list--column"
                                            @click="switchActionOpen(2)">
                                            <div class="ext-list--title">
                                                <i class="fa-solid" :class="pluginStore.actionOpen[2]?'fa-caret-down':'fa-caret-right'"></i>命令（共{{ core.plugins.value[pluginStore.activeOn].register.command.length }}项）
                                            </div>
                                            <table @click.stop 
                                                   class="ext-list--child_list"
                                                   :style="'display:'+(pluginStore.actionOpen[2]?'':'none')">
                                                <thead>
                                                    <tr>
                                                        <th>ID</th>
                                                        <th>名称</th>
                                                        <th>返回类型</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="(item, index) in core.plugins.value[pluginStore.activeOn].register.command" :key="index">
                                                        <td><code>{{ item.key }}</code></td>
                                                        <td>{{ item.name }}</td>
                                                        <td><code>{{ item.returnType }}</code></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </li>
                                        <li class="ext-list--column"
                                            @click="switchActionOpen(3)">
                                            <div class="ext-list--title">
                                                <i class="fa-solid" :class="pluginStore.actionOpen[3]?'fa-caret-down':'fa-caret-right'"></i>事件（共{{ core.plugins.value[pluginStore.activeOn].register.event.length }}项）
                                            </div>
                                            <table @click.stop 
                                                   class="ext-list--child_list"
                                                   :style="'display:'+(pluginStore.actionOpen[3]?'':'none')">
                                                <thead>
                                                    <tr>
                                                        <th>ID</th>
                                                        <th>监听类型</th>
                                                        <th>描述</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="(item, index) in core.plugins.value[pluginStore.activeOn].register.event" :key="index">
                                                        <td><code>{{ item.key }}</code></td>
                                                        <td>{{ item.eventType }}</td>
                                                        <td>{{ item.desc }}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </li>
                                    </ul>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Lucence Insert Module -->
        <div id="lucence-insert--module"
             v-if="LucenceCore.cache.value.components.loaded"
             :style="'bottom:' + (LucenceCore.cache.value.components.enable ? '30px' : '-45%')">
            <div class="lucence-insert--head unselectable">
                <div class="insert-head--title">Components<span>组件</span></div>
                <div class="insert-head--close" @click="core.toggle.components()">
                    <i class="fa-solid fa-xmark closable"></i>
                </div>
            </div>
            <div class="lucence-insert--container">
                <div class="insert-container--renderers unselectable">
                    <div class="renderers-list--container">
                        <div class="renderer-each--plugin"
                             v-for="(plugin, index) in core.plugins.value"
                             :key="'renderer-' + index"
                             @click="togglePluginComponents(index)"
                             :class="componentsStore.activeIndex===index?'active':''">
                            <img :alt="plugin.key"
                                 :src="plugin.detail.icon"
                                 width="46"
                                 height="46" />
                        </div>
                    </div>
                    <div class="renderers-renderer--list">
                        <div class="renderer-collection"
                             v-for="(renderer, index) in core.plugins.value[componentsStore.activeIndex].register.renderers"
                             :key="'collection-' + index">
                            <div class="renderer-collection--title">
                                GROUP {{ renderer.name.toUpperCase() }}
                            </div>
                            <template v-for="(componentName, idx) in Object.keys(renderer.components)"
                                      :key="'component-' + renderer.name + '-' + componentName">
                                <div class="component-of-renderer"
                                     :class="componentsStore.selectComponentIdx === idx ? 'active' : ''"
                                     @click="togglePluginComponent(idx, index, renderer.name, componentName)"
                                     v-if="renderer.components[componentName].showInComponents !== false">
                                    <div class="component-title"><i v-if="renderer.components[componentName].icon" :class="renderer.components[componentName].icon"></i>{{ componentName }}</div>
                                    <div class="component-desc">{{ renderer.components[componentName].desc }}</div>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
                <div class="insert-container--panel">
                    <div class="insert-renderer--config insert-renderer--section">
                        <div class="section--head unselectable">
                            <div class="head--title">配置</div>
                        </div>
                        <div class="section-body">
                            <template v-if="componentsStore.selectComponent && (componentsStore.selectComponent.attributes || componentsStore.selectComponent.allowContent === true)">
                                <FormKit v-model="componentsStore.data" 
                                         @keyup="updatePreview()"
                                         type="form">
                                    <FormKitSchema v-if="componentsStore.selectComponent!.attributes" 
                                                   :key="`key-${core.plugins.value[componentsStore.activeIndex].key}-${componentsStore.selectComponentName}`" 
                                                   :schema="componentsStore.selectComponent!.attributes" 
                                                   :data="componentsStore.data" />
                                    <FormKit
                                        v-if="componentsStore.selectComponent!.allowContent === true"
                                        type="textarea"
                                        name="content"
                                        label="内容"
                                        :help="componentsStore.selectComponent!.allowContentHTML === true ? '填写组件的HTML内容' : '填写组件的文本内容'"/>
                                </FormKit>
                            </template>
                        </div>
                        <div class="section--footer unselectable"
                             :class="(componentsStore.selectComponentIdx === -1 || componentsStore.selectRenderer!.components[componentsStore.selectComponentName].attributes) ? 'disable' : ''">
                            <div class="footer--clear" @click="clearInsertInfo()">清空</div>
                            <div class="footer--confirm" @click="insertComponent()">插入</div>
                        </div>
                    </div>
                    <div class="insert-renderer--preview insert-renderer--section">
                        <div class="section--head">
                            <div class="head--title unselectable">预览</div>
                        </div>
                        <div class="section-body" v-html="componentsStore.previewHTML">
                        </div>
                        <div class="section--footer">
                            <div class="footer--description">
                                <div class="description--head unselectable">组件描述</div>
                                <div class="description--body">
                                    {{
                                        componentsStore.selectRenderer?.desc
                                    }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Lucence Notification Module -->
        <div id="lucence-notification--module"
             :class="`${LucenceCore.notificationCenterOpened.value ? '' : 'closed'} ${LucenceCore.notifyMode.value}`">
            <div class="scrollable">
                <div class="notifications-card unselectable"
                     v-for="notice in LucenceCore.notifications.value"
                     :key="notice[0]"
                     :class="notice[1].active ? 'active' : 'inactive'">
                    <div class="notifications-card--head">
                    <span class="notifications-card--head--title">
                        {{ notice[1].type === 'warning' ? '警告' : notice[1].type === 'error' ? '错误' : '通知' }}
                    </span>
                        <div class="notifications-card--head--close">
                            <div v-if="notice[1].closable !== false" class="codicon codicon-close" @click="LucenceCore.closeNotification(notice[0])"></div>
                        </div>
                    </div>
                    <div v-if="notice[1].loading === true" class="notifications-card--progress-bar">
                        <div class="scrolling-block"></div>
                    </div>
                    <div class="notifications-card--body">
                        <div class="notifications-card--body--row">
                            <div class="notify-type">
                                <div class="codicon" :class="`codicon-${notice[1].type}`"></div>
                            </div>
                            <div class="notify-message">
                                {{ notice[1].message }}
                            </div>
                        </div>
                        <div class="notifications-card--body--row">
                            <div class="notify-source">
                                来源: {{ notice[1].source }}
                            </div>
                            <div class="notify-action">
                                <template v-if="notice[1].reactive === 'change-plugin'">
                                    <a @click="refreshPage()" class="btn-abstract btn-info">重载页面</a>
                                </template>
                                <template v-else-if="notice[1].reactive === 'install-theme-plugin'">
                                    <a class="btn-abstract btn-info" @click="installThemePlugin(notice[1].metadata!.themePlugin!)">安装</a><a class="btn-abstract btn-default">不再提醒</a>
                                </template>
                                <template v-else>
                                    <a v-if="notice[1].closable !== false" class="btn-abstract btn-default" @click="LucenceCore.closeNotification(notice[0])">关闭</a>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="notification-controller unselectable">
                <div class="controller-total--count" style="flex: 1;">
                    <span class="codicon codicon-info"></span> {{ LucenceCore.notificationTypeHolder.value[0] }}
                    <span class="codicon codicon-warning"></span> {{ LucenceCore.notificationTypeHolder.value[1] }}
                    <span class="codicon codicon-error"></span> {{ LucenceCore.notificationTypeHolder.value[2] }}
                </div>
                <div class="controller-mute"
                     @click="LucenceCore.switchNotifyMode()">
                    <a v-if="LucenceCore.notifyMode.value === 'notify'" 
                       title='切换"请勿打扰"模式'
                       class="codicon codicon-bell-slash"></a>
                    <a v-else 
                       title='切换"请勿打扰"模式'
                       class="codicon codicon-bell"></a>
                </div>
                <div class="controller-clear"
                     @click="LucenceCore.clearAllNotifications()" >
                    <a title="全部清除" 
                       class="codicon codicon-clear-all"></a>
                </div>
                <div class="controller-close"
                     @click="LucenceCore.switchOpenNotificationCenter()">
                    <a class="codicon codicon-chevron-down"
                       title="关闭通知"></a>
                </div>
            </div>
        </div>
    </section>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, ref} from "vue";
import {LucenceCore} from "@/core/LucenceCore";
import {FormKit, FormKitSchema} from "@formkit/vue";
import type {
    PluginComponent,
    PluginHolder,
    PluginRenderer
} from "@/extension/ArgumentPlugin";

const refreshPage = () => {
    location.reload(); // 刷新当前页面
};
const emit = defineEmits<{
    (event: "update:raw",     value: string): void;
    (event: "update:content", value: string): void;
    (event: "update",         value: string): void;
}>();
const props = defineProps({
    raw: {
        type: String,
        required: false,
        default: "",
    },
    content: {
        type: String,
        required: false,
        default: "",
    },
});
let core: LucenceCore;
// Plugin Store Module
const pluginStore = ref({
    activeOn: 0,
    actionOn: 0,
    actionOpen: [true, true, true, true]
});
function closeExtension(): void {
    core.toggle.plugin.close();
    pluginStore.value.activeOn = 0;
    pluginStore.value.actionOn = 0;
    pluginStore.value.actionOpen = [true, true, true];
}
function switchActionOpen(index: number): void {
    if (pluginStore.value.activeOn === index) return;
    pluginStore.value.actionOpen[index] = !pluginStore.value.actionOpen[index];
}
function switchViewPlugin(index: number): void {
    if (pluginStore.value.activeOn === index) return;
    pluginStore.value.activeOn = index;
    pluginStore.value.actionOn = 0;
}
// ------ 组件变量对象
const componentsStore = ref({
    activeIndex: 0,
    selectRendererIdx: -1,
    selectRenderer: null as PluginRenderer | null,
    selectRendererName: '',
    selectComponentIdx: -1,
    selectComponent: null as PluginComponent | null,
    selectComponentName: '',
    previewHTML: '',
    data: { content: '', } as any,
});
// ------ 切换插件，清空选中的对象
function togglePluginComponents(index: number) {
    if (componentsStore.value.activeIndex === index) return;
    componentsStore.value.activeIndex = index;
    componentsStore.value.selectRendererIdx = -1;
    componentsStore.value.selectRenderer = null;
    componentsStore.value.selectRendererName = '';
    componentsStore.value.selectComponentIdx = -1;
    componentsStore.value.selectComponent = null;
    componentsStore.value.selectComponentName = '';
    componentsStore.value.previewHTML = '';
    componentsStore.value.data = { content: '', };
}
// ------ 切换组件
function togglePluginComponent(index: number, selectRenderer: number, selectRendererName: string, componentName: string) {
    if (componentsStore.value.selectComponentIdx === index) return;
    componentsStore.value.selectRendererIdx = selectRenderer;
    componentsStore.value.selectRenderer = core.plugins.value[componentsStore.value.activeIndex].register.renderers[componentsStore.value.selectRendererIdx];
    componentsStore.value.selectRendererName = selectRendererName;
    componentsStore.value.selectComponentIdx = index;
    componentsStore.value.selectComponent = core.plugins.value[componentsStore.value.activeIndex].register.renderers[componentsStore.value.selectRendererIdx].components[componentName];
    componentsStore.value.selectComponentName = componentName;
    componentsStore.value.previewHTML = '';
    componentsStore.value.data = { content: '', };
}
// ------ 验证组件有效性以便后续插入组件和清空组件表单
function isValidComponent(): boolean {
    return (componentsStore.value.selectComponent !== null && componentsStore.value.selectComponent.attributes?.length === 0);
}
// ------ 插入组件
function insertComponent() {
    if (isValidComponent()) return;
    core.insertComponent(componentsStore.value.selectRendererName, {
        name: componentsStore.value.selectComponentName,
        ...componentsStore.value.data,
    });
}
// ------ 清空表单
function clearInsertInfo() {
    if (isValidComponent()) return;
    componentsStore.value.data = {};
}
// ------ 更新组件预览
function updatePreview() {
    componentsStore.value.previewHTML = core.previewComponent(componentsStore.value.selectComponent!, componentsStore.value.data);
}
// ------ 上传插件
const isUploading = ref<boolean>(false);
function uploadPlugin() {
    if (isUploading.value) return;
    const fileInput = document.getElementById('uploadPlugin')! as HTMLInputElement;
    fileInput.click();
}
// ------ 安装插件
function handleUploadingPlugin() {
    if (isUploading.value) return;
    const fileInput = document.getElementById('uploadPlugin')! as HTMLInputElement;
    if (!fileInput.files) return;
    const file: File = fileInput.files[0];
    if (file) {
        isUploading.value = true;
        // 上传并通知安装方法
        doUploadPlugin(file);
    }
}
function installThemePlugin(themePluginHolder: PluginHolder) {
    LucenceCore.installThemePlugin(themePluginHolder).then((response) => {
        if (!response) {
            LucenceCore.pushNotification({
                type: 'error',
                message: `扩展"${themePluginHolder.key}"已存在，请勿重复安装。`,
                source: 'Lucence Editor Extensions (扩展系统)',
                reactive: 'none',
            });
            return;
        }
        LucenceCore.pushNotification({
            type: 'info',
            message: `已安装当前主题扩展"${themePluginHolder.detail.name}"，重载页面以应用扩展。`,
            source: 'Lucence Editor Extensions (扩展系统)',
            reactive: 'change-plugin',
        });
    });
}
// ------ 打开插件
function openExtension() {
    if (!buildDraggableOnce) {
        buildDraggable();
    }
    core.toggle.plugin.open()
}
// ------ 拖拽安装
let buildDraggableOnce: boolean = false;
function buildDraggable() {
    const draggableInstall = document.getElementById('draggable-install')!;
    // 拖拽上传
    draggableInstall.addEventListener("dragenter", handleEvent);
    draggableInstall.addEventListener("dragover", handleEvent);
    draggableInstall.addEventListener("drop", handleEvent);
    draggableInstall.addEventListener("dragleave", handleEvent);
    function handleEvent(event: any) {
        event.preventDefault();
        if (event.type === 'drop') {
            draggableInstall.classList.remove('draggable');
            if (event.dataTransfer.files.length === 0) return;
            const file = event.dataTransfer.files[0];
            doUploadPlugin(file);
        } else if (event.type === 'dragleave') {
            draggableInstall.classList.remove('draggable');
        } else {
            draggableInstall.classList.add('draggable');
        }
    }
}
// ------ 统一上传插件
function doUploadPlugin(file: File) {
    LucenceCore.uploadPlugin(file)
        .then((response) => {
            if (!response) {
                LucenceCore.pushNotification({
                    type: 'error',
                    message: `扩展"${file.name}"已存在，请勿重复安装。`,
                    source: 'Lucence Editor Extensions (扩展系统)',
                    reactive: 'none',
                });
                return;
            }
            isUploading.value = false;
            const data = response.data;
            if (data.code === 200 || data.totalPages !== 0) {
                LucenceCore.pushNotification({
                    type: 'info',
                    message: `已安装扩展"${file.name}"，重载页面以应用扩展。`,
                    source: 'Lucence Editor Extensions (扩展系统)',
                    reactive: 'change-plugin',
                });
            } else {
                if (data.message === "Plugin has existed.") {
                    LucenceCore.pushNotification({
                        type: 'error',
                        message: `扩展"${file.name}"已存在，请勿重复安装。`,
                        source: 'Lucence Editor Extensions (扩展系统)',
                        reactive: 'none',
                    });
                } else {
                    LucenceCore.pushNotification({
                        type: 'error',
                        message: `安装扩展"${file.name}"时发生未知错误`,
                        source: 'Lucence Editor Extensions (扩展系统)',
                        reactive: 'none',
                    });
                }
            }
        })
        .catch(error => {
            isUploading.value = false
            console.error(error);
            LucenceCore.pushNotification({
                type: 'error',
                message: `安装扩展"${file.name}"时发生错误`,
                source: 'Lucence Editor Extensions (扩展系统)',
                reactive: 'none',
            });
        });
}
// ------ 卸载插件
function uninstallPlugin(plugin: PluginHolder) {
    LucenceCore.uninstallPlugin(plugin).then((response) => {
        if (!response) {
            LucenceCore.pushNotification({
                type: 'error',
                message: `扩展"${plugin.detail.name}"已被卸载，请勿重复卸载。`,
                source: 'Lucence Editor Extensions (扩展系统)',
                reactive: 'none',
            });
            return;
        }
        LucenceCore.pushNotification({
            type: 'warning',
            message: `扩展"${plugin.detail.name}"已被卸载，重载页面以应用扩展的变更。`,
            source: `${plugin.detail.name} (${plugin.detail.name}) (扩展)`,
            reactive: 'change-plugin',
        });
    }).catch(() => {
        LucenceCore.pushNotification({
            type: 'error',
            message: `卸载扩展"${plugin.detail.name}"时发生错误。`,
            source: `${plugin.detail.name} (${plugin.detail.name}) (扩展)`,
            reactive: 'none',
        });
    });
}
// ------ 禁用/启用插件
function disablePlugin(plugin: PluginHolder) {
    const mode: string = !plugin.enable ? '启用' : '禁用';
    LucenceCore.switchDisablePlugin(plugin).then(() => {
        LucenceCore.pushNotification({
            type: 'warning',
            message: `扩展"${plugin.detail.name}"已被${mode}，重载页面以应用扩展的变更。`,
            source: `${plugin.detail.name} (${plugin.detail.name}) (扩展)`,
            reactive: 'change-plugin',
        });
    }).catch(() => {
        LucenceCore.pushNotification({
            type: 'error',
            message: `${mode}扩展"${plugin.detail.name}"时发生错误`,
            source: `${plugin.detail.name} (${plugin.detail.name}) (扩展)`,
            reactive: 'none',
        });
    });
}
// ------ 初始化
const extensionUUID = LucenceCore.pushNotification({
    closable: false,
    loading: true,
    type: 'info',
    message: '正在激活扩展。',
    source: 'Lucence Editor (系统)',
    reactive: 'none',
});

onMounted(async () => {
    // 实例化编辑器
    core = new LucenceCore();
    await core.postConstructor(props.raw);
    core.build(function (): void {
        const markdown: string = core.getMarkdown();
        const html: string = core.getHTML();
        emit('update:raw',     markdown);
        emit('update:content', html);
        emit('update',         markdown);
    });
    setTimeout((): void => {
        LucenceCore.closeNotification(extensionUUID);
    }, 2500);
})
onUnmounted(async () => {
    core.destroy();
})
</script>

<style>
    @import "@vscode/codicons/dist/codicon.css";
    @import "@toast-ui/editor/dist/toastui-editor.css";
    @import "@fortawesome/fontawesome-free/css/all.min.css";
    @import "katex/dist/katex.min.css";
    @import "@/css/EditorStyle.css";
</style>
