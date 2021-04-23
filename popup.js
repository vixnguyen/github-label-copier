const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_PAGE = 'https://github.com/';

fetchLabelsFromRepo = async ({src, token}) => {
  let labels = await fetch(`${GITHUB_API_BASE}/repos/${src}/labels`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `token ${token}`
    }
  });
  return labels.json();
};

createLabels = async ({labels, repo, token}) => {
  let count = {
    success: 0,
    error: 0
  };
  let promises = [];
  for (let item of labels) {
    promises.push(new Promise((resolve, reject) => {
      return fetch(`${GITHUB_API_BASE}/repos/${repo}/labels`, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${token}`
        },
        method: 'POST',
        body: JSON.stringify(item)
      }).then(response => {
        if (response && response.ok) {
          resolve(1);
        } else {
          reject(0);
        }
      }).catch((error) => {
        alertMsg({
          type: 'error'
        });
        reject(0);
      });
    }));
  }
  await Promise.allSettled(promises).then((results) => {
    results.forEach((result) => {
      if (result.status === 'rejected') {
        count.error++;
      } else {
        count.success++;
      }
    });
  });
  return count;
};

getOwnerAndRepo = (url) => {
  if (url) {
    let urlParts = url.split(GITHUB_PAGE);
    return urlParts[1];
  }
  return '';
};

alertMsg = ({msg, type}) => {
  $alertBox.innerHTML = msg || `
    Please correct:
    <ul>
      <li>Source repo URL</li>
      <li>Destination repo URL</li>
      <li>GitHub token</li>
    </ul>
    And make sure that you have permissions to read and write on those repositories.
  `;
  $alertBox.classList = `alert alert-${type}`;
};

let $inputSource = document.getElementById('js-source');
let $inputDestination = document.getElementById('js-destination');
let $inputToken = document.getElementById('js-token');
let $btnSubmit = document.getElementById('js-submit');
let $alertBox = document.getElementById('js-alert');

$btnSubmit.addEventListener('click', () => {
  const requestData = {
    src: getOwnerAndRepo($inputSource.value),
    des: getOwnerAndRepo($inputDestination.value),
    token: $inputToken.value
  };
  alertMsg({
    msg: `Copying from '${requestData.src}' to '${requestData.des}' ...`,
    type: 'secondary'
  });
  fetchLabelsFromRepo(requestData).then((data) => {
    if (data && data.length) {
      createLabels({
        labels: data,
        repo: requestData.des,
        token: requestData.token
      }).then((result) => {
        if (result) {
          alertMsg({
            msg: `Copied. Total: ${data.length}, Success: ${result.success}, Error: ${result.error}`,
            type: 'success'
          });
        } else {
          alertMsg({
            type: 'error'
          });
        }
      }).catch(() => {
        alertMsg({
          type: 'error'
        });
      });
    } else {
      alertMsg({
        type: 'error'
      });
    }
  }).catch(() => {
    alertMsg({
      type: 'error'
    });
  });
});
