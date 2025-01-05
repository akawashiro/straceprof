# How to publish a new package

Run the following commands in the root directory of the project.

## Remove the old package
```
$ rm -rf dist
```

## Build the package
```
$ python3 -m build
```

## Check the contents of the package
```
$ tar -tvf dist/*.tar.gz
$ zipinfo dist/*.whl
```

## Publish the package to test.pypi.org
```
$ python3 -m twine upload --repository testpypi dist/* --verbose
```

## Confirm the package is available on test.pypi.org
Check [https://test.pypi.org/project/straceprof/](https://test.pypi.org/project/straceprof/).

## Publish the package to pypi.org
```
$ python3 -m twine upload dist/* --verbose
```
