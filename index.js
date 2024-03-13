function test(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
  return "foo"
  debugger;
}

function nestedIfTest() {
  if (true) {
    if (1 == 1) {
      if (2 == 2) {
        return 2
      }
      return 1
    }
    return 3
  }
}

const articleUpdate = async (req, articleData) => {
  const data = Object.assign(req.body, req.params, req.query, req.user, req.headers);
  const headers = createCommonHeader(data)

  if (data.art_type != articleData.art_type) throw errorManager.getHttpError('CANT_UPDATE_TYPE');

  // sensitive key removal
  delete data.art_fk_temp_id;
  delete data.art_schedule_status;
  delete data.art_schedule_at;
  delete data.art_schedule_by;

  // data.art_url = (data.art_url || '').trim().replace(/ /g, '-').toLowerCase()

  const exist = await ArticleModel.findOne({ art_url: { $regex: `^${escapeRegExp(data.art_url)}$`, '$options': 'i' }, art_fk_trgt_id: data.x_target, art_id: { $ne: data.art_id } });
  if (exist) throw errorManager.getHttpError('DUPLICATE_ARTICLE_URL');

  if (articleData.art_fk_cat_id !== data.art_fk_cat_id || articleData.art_fk_subcat_id !== data.art_fk_subcat_id) {
    const catResponse = await makeExternalRequest({ method: 'GET', url: replaceDoubleBraces(externalUrl.MASTER.CAT_SUBCAT_GET_BY_ID, { cat_id: data.art_fk_cat_id, subcat_id: data.art_fk_subcat_id }), headers })
    data.art_cat = catResponse.category;
    data.art_subcat = catResponse.data;
  }

  data.art_genre = undefined;
  if (data.art_fk_genre_id) {
    const generResponse = await makeExternalRequest({ method: 'GET', url: replaceDoubleBraces(externalUrl.MASTER.MASTER_GET_BY_KEY_VALUE, { key: 'initial_article_genre_config', value: data.art_fk_genre_id }), headers })
    data.art_genre = generResponse?.data;
  }

  data.art_state = undefined;
  data.art_city = undefined;
  if (data.art_fk_state_id) {
    const cityResponse = await makeExternalRequest({ method: 'GET', url: replaceDoubleBraces(externalUrl.USER.USER_GET_CITY_STATE, { state_id: data.art_fk_state_id, city_id: data.art_fk_city_id }), headers })
    data.art_city = cityResponse?.data.city;
    data.art_state = cityResponse?.data.state;
  }

  data.art_updated_by = data.session;
  data.art_updated_on = istCurrentDate();

  if (!articleData.art_islive && data.art_islive && data.art_islive === 1) {
    const artSetting = await ArticleSettingModel.findOne({ artset_fk_art_id: data.art_id, artset_fk_trgt_id: data.x_target });
    if (artSetting) {
      let liveBlogConfig = await makeExternalRequest({ method: 'GET', url: replaceDoubleBraces(externalUrl.MASTER.MASTER_GET_BY_KEY, { key: 'live_blog_config' }), headers: createCommonHeader(data) });
      if (liveBlogConfig && liveBlogConfig.data) {
        liveBlogConfig = liveBlogConfig.data;
        artSetting.artset_template.temp_controls = {
          ...artSetting.artset_template?.temp_controls || {},
          featured_live_blog: liveBlogConfig.master_value[0]?.config?.temp_controls?.featured_live_blog || {}
        }
        artSetting.artset_template.temp_layout = (artSetting.artset_template?.temp_layout || []).concat(liveBlogConfig.master_value[0]?.config?.temp_layout || []);
        await ArticleSettingModel.updateOne({ artset_fk_art_id: data.art_id }, {
          artset_template: artSetting.artset_template,
          artset_updated_on: istCurrentDate(),
          artset_updated_by: data.session
        })
      }
    }
  }

  if (data.art_type === 'html') {
    await ArticleSettingModel.updateOne({ artset_fk_art_id: data.art_id, artset_fk_trgt_id: data.x_target }, {
      artset_html: data.artset_html,
      artset_updated_on: istCurrentDate(),
      artset_updated_by: data.session
    })
  }

  // Save to article history
  articleHistory({ ...(articleData.toObject()), old_status: articleData.art_status, title: 'update' })

  if (data.art_isbreaking && data.art_breaking_end) {
    data.art_breaking_end = {
      datetime: getDate({ amount: data.art_breaking_end, unit: 'minutes' }).iso,
      duration: data.art_breaking_end
    };
  }

  return await ArticleModel.updateOne({ art_id: data.art_id, art_fk_trgt_id: data.x_target }, data);
}