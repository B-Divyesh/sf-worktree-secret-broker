#define _GNU_SOURCE
#include <dlfcn.h>
#include <errno.h>
#include <fcntl.h>
#include <stdlib.h>
#include <sys/socket.h>
#include <unistd.h>

int socket(int domain, int type, int protocol) {
  static int (*real_socket)(int, int, int);
  if (!real_socket) real_socket = dlsym(RTLD_NEXT, "socket");
  if (domain == AF_INET || domain == AF_INET6) {
    const char *marker = getenv("WSB_NETWORK_MARKER");
    if (marker) {
      int fd = open(marker, O_CREAT | O_WRONLY, 0600);
      if (fd >= 0) close(fd);
    }
    errno = EACCES;
    return -1;
  }
  return real_socket(domain, type, protocol);
}
