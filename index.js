function test(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
  return "foo"
  debugger;
}

function nestedIfTest() {
  if (data.art_image_format?.original?.path) {
    if (data.art_image_format?.original?.path.toLowerCase() !== articleData.art_image_format?.original?.path.toLowerCase()) {
      const mediaSizeResponse = await makeExternalRequest({ method: 'POST', url: externalUrl.MEDIA_TARGET.MEDIA_SIZE_FORMAT, body: { media: data.art_image_format }, headers });
      data.art_image_format = mediaSizeResponse.data;
    }
  }
}